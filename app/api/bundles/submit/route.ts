import { NextResponse } from 'next/server';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { webcrypto as nodeWebcrypto } from 'crypto';
import { z } from 'zod';
// Legacy Jito submission disabled in current build scope
// import { sendBundle, getBundleStatuses, validateTipAccount } from '@/lib/server/jitoService';
import { isTestMode } from '@/lib/testMode';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { readJsonSafe, getEnvInt } from '@/lib/server/request';
import * as Sentry from '@sentry/nextjs';
import { getNextLeaders } from '@/lib/server/leaderSchedule';
import { getDb } from '@/lib/db/sqlite';
const _db = getDb();
import { getPrisma as _getPrisma } from '@/lib/server/prisma';
import { ENABLE_SLOT_TARGETING } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';

interface BundleSubmitRequest {
  region?: RegionKey;
  txs_b64: string[];
  simulateOnly?: boolean;
  mode?: 'regular' | 'instant' | 'delayed';
  delay_seconds?: number;
  // Optional target slot when ENABLE_SLOT_TARGETING is true; no-op otherwise
  target_slot?: number;
}

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon';
    const cfg = getRateConfig('submit');
    // Per-IP + optional per-wallet rate-limiting key
    const wallet = request.headers.get('x-wallet') || 'no-wallet';
    const rl = await rateLimit(`submit:${ip}:${wallet}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const minTxs = isTestMode() ? 0 : 1;
    const bodySchema = z.object({
      region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
      txs_b64: z.array(z.string().min(4)).min(minTxs).max(getEnvInt('SUBMIT_MAX_TXS', 5)),
      simulateOnly: z.boolean().optional(),
      mode: z.enum(['regular', 'instant', 'delayed']).optional(),
      delay_seconds: z
        .number()
        .int()
        .min(0)
        .max(getEnvInt('SUBMIT_MAX_DELAY_SECONDS', 120))
        .optional(),
      target_slot: z.number().int().positive().optional(),
    });

    const body: BundleSubmitRequest = await readJsonSafe<BundleSubmitRequest>(request, {
      maxBytes: getEnvInt('PAYLOAD_LIMIT_SUBMIT_BYTES', 32 * 1024),
      schema: bodySchema as unknown as z.ZodSchema<BundleSubmitRequest>,
    });
    const {
      region = 'ffm',
      txs_b64,
      simulateOnly = false,
      mode = 'regular',
      delay_seconds = 0,
      target_slot,
    } = body;

    Sentry.addBreadcrumb({
      category: 'bundles',
      message: 'Bundle submit received',
      level: 'info',
      data: { region, simulateOnly, mode, delay_seconds, tx_count: txs_b64?.length || 0 },
    });

    let transactions: VersionedTransaction[];
    const subtle =
      (globalThis as { crypto?: { subtle?: unknown } }).crypto?.subtle || nodeWebcrypto?.subtle;
    if (!subtle) throw new Error('WebCrypto not available');
    const originalHash = await subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(txs_b64)),
    );
    const payloadHash = Buffer.from(new Uint8Array(originalHash)).toString('hex');
    try {
      transactions = txs_b64.map((encoded) =>
        VersionedTransaction.deserialize(Buffer.from(encoded, 'base64')),
      );
    } catch {
      return NextResponse.json({ error: 'Failed to deserialize transactions' }, { status: 400 });
    }

    const _lastTx = transactions[transactions.length - 1];
    // if (!isTestMode() && !validateTipAccount(_lastTx)) {
    //   return NextResponse.json(
    //     { error: 'Last transaction must contain a valid JITO tip transfer' },
    //     { status: 400 },
    //   );
    // }

    if (simulateOnly) {
      // In test mode, skip RPC simulation and return a stubbed success
      if (isTestMode()) {
        Sentry.addBreadcrumb({
          category: 'bundles',
          message: 'Simulation stub (test mode)',
          level: 'info',
        });
        return NextResponse.json({
          success: true,
          payloadHash,
          signatures: transactions.map((tx) => {
            const sig = tx.signatures[0];
            return sig ? Buffer.from(sig).toString('base64') : null;
          }),
        });
      }
      const SERVER_RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(SERVER_RPC);
      // Blockhash freshness: ensure remaining blocks > 0
      try {
        const { lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
        const bh = await connection.getBlockHeight('processed');
        if (lastValidBlockHeight - bh <= 0) {
          return NextResponse.json({ error: 'Stale blockhash' }, { status: 400 });
        }
      } catch (_e) {
        void 0;
      }
      try {
        for (const tx of transactions) {
          const result = await connection.simulateTransaction(tx, {
            sigVerify: false,
            commitment: 'processed',
          });
          if (result.value.err) {
            Sentry.captureMessage('Simulation failed', {
              level: 'warning',
              extra: { error: result.value.err },
            });
            return NextResponse.json(
              { error: `Transaction simulation failed: ${JSON.stringify(result.value.err)}` },
              { status: 400 },
            );
          }
        }
        Sentry.addBreadcrumb({
          category: 'bundles',
          message: 'Simulation succeeded',
          level: 'info',
        });
        return NextResponse.json({
          success: true,
          payloadHash,
          signatures: transactions.map((tx) => {
            const sig = tx.signatures[0];
            return sig ? Buffer.from(sig).toString('base64') : null;
          }),
        });
      } catch (error: unknown) {
        Sentry.captureException(error);
        const msg = (error as Error)?.message || 'Simulation error';
        return NextResponse.json({ error: `Simulation error: ${msg}` }, { status: 500 });
      }
    }

    if (mode === 'delayed' && delay_seconds && delay_seconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay_seconds * 1000));
    }

    // Optional integrity check: require client to echo payloadHash if previously simulated
    const clientPayloadHash = request.headers.get('x-payload-hash');
    if (clientPayloadHash && clientPayloadHash !== payloadHash) {
      return NextResponse.json({ error: 'Payload changed since simulation' }, { status: 400 });
    }

    // In test mode, do not send real bundle; return a fake landed response
    if (isTestMode()) {
      const bundle_id = `TEST-${Date.now()}`;
      Sentry.addBreadcrumb({
        category: 'bundles',
        message: 'Send stub (test mode)',
        level: 'info',
        data: { region },
      });
      return NextResponse.json({
        bundle_id,
        signatures: transactions.map((tx) => {
          const sig = tx.signatures[0];
          return sig ? Buffer.from(sig).toString('base64') : null;
        }),
        slot: 123456789,
        status: 'landed',
        attempts: 1,
        payloadHash,
      });
    }

    // Breadcrumb next leaders and remaining blockhash life
    try {
      const SERVER_RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(SERVER_RPC);
      const leaders = await getNextLeaders(connection, 16);
      const { lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
      const bh = await connection.getBlockHeight('processed');
      const remainingBlocks = lastValidBlockHeight - bh;
      const slotTargeting = ENABLE_SLOT_TARGETING && typeof target_slot === 'number';
      Sentry.addBreadcrumb({
        category: 'bundles',
        message: 'Sending bundle',
        level: 'info',
        data: {
          region,
          nextLeaders: leaders.nextLeaders.slice(0, 3),
          remainingBlocks,
          slotTargeting,
          target_slot,
        },
      });
    } catch (_e) {
      Sentry.addBreadcrumb({
        category: 'bundles',
        message: 'Sending bundle',
        level: 'info',
        data: { region },
      });
    }
    return NextResponse.json({ error: 'bundler_disabled' }, { status: 501 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    // Bundle submission error
    Sentry.captureException(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
