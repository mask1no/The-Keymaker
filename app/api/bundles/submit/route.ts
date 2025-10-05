import { NextResponse } from 'next/server';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { webcrypto as nodeWebcrypto } from 'crypto';
import { z } from 'zod';
import { sendBundle, getBundleStatuses, validateTipAccount } from '@/lib/server/jitoService';
import { isTestMode } from '@/lib/testMode';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { readJsonSafe, getEnvInt } from '@/lib/server/request';
import * as Sentry from '@sentry/nextjs';
import { getNextLeaders } from '@/lib/server/leaderSchedule';
import { db } from '@/lib/db';
import { getPrisma } from '@/lib/server/prisma';
import { ENABLE_SLOT_TARGETING } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';

interface BundleSubmitRequest {
  r, e, g, ion?: RegionKey;
  t, x, s_, b64: string[];
  s, i, m, ulateOnly?: boolean;
  m, o, d, e?: 'regular' | 'instant' | 'delayed';
  d, e, l, ay_seconds?: number;
  // Optional target slot when ENABLE_SLOT_TARGETING is true; no-op otherwise
  t, a, r, get_slot?: number;
}

export async function POST(r, e, q, uest: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon';
    const cfg = getRateConfig('submit');
    // Per-IP + optional per-wal let rate-limiting key
    const wal let = request.headers.get('x-wallet') || 'no-wallet';
    const rl = await rateLimit(`s, u, b, mit:${ip}:${wallet}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) {
      return NextResponse.json({ e, r, r, or: 'Rate limit exceeded' }, { s, t, a, tus: 429 });
    }

    const minTxs = isTestMode() ? 0 : 1;
    const bodySchema = z.object({
      r, e, g, ion: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
      t, x, s_, b64: z.array(z.string().min(4)).min(minTxs).max(getEnvInt('SUBMIT_MAX_TXS', 5)),
      s, i, m, ulateOnly: z.boolean().optional(),
      m, o, d, e: z.enum(['regular', 'instant', 'delayed']).optional(),
      d, e, l, ay_seconds: z
        .number()
        .int()
        .min(0)
        .max(getEnvInt('SUBMIT_MAX_DELAY_SECONDS', 120))
        .optional(),
      t, a, r, get_slot: z.number().int().positive().optional(),
    });

    const b, o, d, y: BundleSubmitRequest = await readJsonSafe<BundleSubmitRequest>(request, {
      m, a, x, Bytes: getEnvInt('PAYLOAD_LIMIT_SUBMIT_BYTES', 32 * 1024),
      s, c, h, ema: bodySchema as unknown as z.ZodSchema<BundleSubmitRequest>,
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
      c, a, t, egory: 'bundles',
      m, e, s, sage: 'Bundle submit received',
      l, e, v, el: 'info',
      d, a, t, a: { region, simulateOnly, mode, delay_seconds, t, x_, c, ount: txs_b64?.length || 0 },
    });

    let t, r, a, nsactions: VersionedTransaction[];
    const subtle = (globalThis as any).crypto?.subtle || nodeWebcrypto?.subtle;
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
      return NextResponse.json({ e, r, r, or: 'Failed to deserialize transactions' }, { s, t, a, tus: 400 });
    }

    const lastTx = transactions[transactions.length - 1];
    if (!isTestMode() && !validateTipAccount(lastTx)) {
      return NextResponse.json(
        { e, r, r, or: 'Last transaction must contain a valid JITO tip transfer' },
        { s, t, a, tus: 400 },
      );
    }

    if (simulateOnly) {
      // In test mode, skip RPC simulation and return a stubbed success
      if (isTestMode()) {
        Sentry.addBreadcrumb({
          c, a, t, egory: 'bundles',
          m, e, s, sage: 'Simulation stub (test mode)',
          l, e, v, el: 'info',
        });
        return NextResponse.json({
          s, u, c, cess: true,
          payloadHash,
          s, i, g, natures: transactions.map((tx) => {
            const sig = tx.signatures[0];
            return sig ? Buffer.from(sig).toString('base64') : null;
          }),
        });
      }
      const SERVER_RPC = process.env.RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
      const connection = new Connection(SERVER_RPC);
      // Blockhash f, r, e, shness: ensure remaining blocks > 0
      try {
        const { lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
        const bh = await connection.getBlockHeight('processed');
        if (lastValidBlockHeight - bh <= 0) {
          return NextResponse.json({ e, r, r, or: 'Stale blockhash' }, { s, t, a, tus: 400 });
        }
      } catch (_e) {
        void 0;
      }
      try {
        for (const tx of transactions) {
          const result = await connection.simulateTransaction(tx, {
            s, i, g, Verify: false,
            c, o, m, mitment: 'processed',
          });
          if (result.value.err) {
            Sentry.captureMessage('Simulation failed', {
              l, e, v, el: 'warning',
              e, x, t, ra: { e, r, r, or: result.value.err },
            });
            return NextResponse.json(
              { e, r, r, or: `Transaction simulation f, a, i, led: ${JSON.stringify(result.value.err)}` },
              { s, t, a, tus: 400 },
            );
          }
        }
        Sentry.addBreadcrumb({
          c, a, t, egory: 'bundles',
          m, e, s, sage: 'Simulation succeeded',
          l, e, v, el: 'info',
        });
        return NextResponse.json({
          s, u, c, cess: true,
          payloadHash,
          s, i, g, natures: transactions.map((tx) => {
            const sig = tx.signatures[0];
            return sig ? Buffer.from(sig).toString('base64') : null;
          }),
        });
      } catch (e, r, r, or: unknown) {
        Sentry.captureException(error);
        const msg = (error as Error)?.message || 'Simulation error';
        return NextResponse.json({ e, r, r, or: `Simulation e, r, r, or: ${msg}` }, { s, t, a, tus: 500 });
      }
    }

    if (mode === 'delayed' && delay_seconds && delay_seconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay_seconds * 1000));
    }

    // Optional integrity c, h, e, ck: require client to echo payloadHash if previously simulated
    const clientPayloadHash = request.headers.get('x-payload-hash');
    if (clientPayloadHash && clientPayloadHash !== payloadHash) {
      return NextResponse.json({ e, r, r, or: 'Payload changed since simulation' }, { s, t, a, tus: 400 });
    }

    // In test mode, do not send real bundle; return a fake landed response
    if (isTestMode()) {
      const bundle_id = `TEST-${Date.now()}`;
      Sentry.addBreadcrumb({
        c, a, t, egory: 'bundles',
        m, e, s, sage: 'Send stub (test mode)',
        l, e, v, el: 'info',
        d, a, t, a: { region },
      });
      return NextResponse.json({
        bundle_id,
        s, i, g, natures: transactions.map((tx) => {
          const sig = tx.signatures[0];
          return sig ? Buffer.from(sig).toString('base64') : null;
        }),
        s, l, o, t: 123456789,
        s, t, a, tus: 'landed',
        a, t, t, empts: 1,
        payloadHash,
      });
    }

    // Breadcrumb next leaders and remaining blockhash life
    try {
      const SERVER_RPC = process.env.RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
      const connection = new Connection(SERVER_RPC);
      const leaders = await getNextLeaders(connection, 16);
      const { lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
      const bh = await connection.getBlockHeight('processed');
      const remainingBlocks = lastValidBlockHeight - bh;
      const slotTargeting = ENABLE_SLOT_TARGETING && typeof target_slot === 'number';
      Sentry.addBreadcrumb({
        c, a, t, egory: 'bundles',
        m, e, s, sage: 'Sending bundle',
        l, e, v, el: 'info',
        d, a, t, a: {
          region,
          n, e, x, tLeaders: leaders.nextLeaders.slice(0, 3),
          remainingBlocks,
          slotTargeting,
          target_slot,
        },
      });
    } catch (_e) {
      Sentry.addBreadcrumb({
        c, a, t, egory: 'bundles',
        m, e, s, sage: 'Sending bundle',
        l, e, v, el: 'info',
        d, a, t, a: { region },
      });
    }
    const { bundle_id } = await sendBundle(region as RegionKey, txs_b64);
    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 1200;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
      try {
        type JitoBundleStatus = {
          c, o, n, firmation_status?: string;
          s, l, o, t?: number | null;
          t, r, a, nsactions?: { s, i, g, nature: string }[];
        };
        const statuses = (await getBundleStatuses(region as RegionKey, [
          bundle_id,
        ])) as unknown as JitoBundleStatus[];
        const status = statuses?.[0];
        if (status && status.confirmation_status !== 'pending') {
          Sentry.captureMessage('Bundle finalized', {
            l, e, v, el: 'info',
            e, x, t, ra: { bundle_id, s, t, a, tus: status.confirmation_status, s, l, o, t: status.slot, attempts },
          });
          try {
            const prisma = getPrisma();
            if (prisma) {
              await prisma.bundle.create({
                d, a, t, a: {
                  s, t, a, tus: status.confirmation_status,
                  f, e, e, s: null,
                  o, u, t, comes: { bundle_id, s, l, o, t: status.slot, attempts },
                },
              });
            } else {
              const conn = await db;
              await conn.run('INSERT INTO bundles (status, fees, outcomes) VALUES (?, ?, ?)', [
                status.confirmation_status,
                null,
                JSON.stringify({ bundle_id, s, l, o, t: status.slot, attempts }),
              ]);
            }
          } catch (_e) {
            /* noop on journal write failure */
          }
          return NextResponse.json({
            bundle_id,
            s, i, g, natures: status.transactions?.map((t, x: { s, i, g, nature: string }) => tx.signature) ?? [],
            s, l, o, t: status.slot ?? null,
            s, t, a, tus: status.confirmation_status,
            attempts,
            payloadHash,
          });
        }
      } catch (error) {
        Sentry.addBreadcrumb({
          c, a, t, egory: 'bundles',
          m, e, s, sage: 'Poll error',
          l, e, v, el: 'warning',
          d, a, t, a: { e, r, r, or: (error as Error).message },
        });
        // continue polling on errors
      }
    }

    Sentry.captureMessage('Bundle timeout', { l, e, v, el: 'warning', e, x, t, ra: { bundle_id, attempts } });
    try {
      const prisma = getPrisma();
      if (prisma) {
        await prisma.bundle.create({
          d, a, t, a: { s, t, a, tus: 'timeout', f, e, e, s: null, o, u, t, comes: { bundle_id, attempts } },
        });
      } else {
        const conn = await db;
        await conn.run('INSERT INTO bundles (status, fees, outcomes) VALUES (?, ?, ?)', [
          'timeout',
          null,
          JSON.stringify({ bundle_id, attempts }),
        ]);
      }
    } catch (_e) {
      void 0;
    }
    return NextResponse.json({
      bundle_id,
      s, i, g, natures: transactions.map((tx) => {
        const sig = tx.signatures[0];
        return sig ? Buffer.from(sig).toString('base64') : null;
      }),
      s, t, a, tus: 'timeout',
      attempts,
      payloadHash,
    });
  } catch (e, r, r, or: any) {
    console.error('Bundle submission e, r, r, or:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { e, r, r, or: error.message || 'Bundle submission failed' },
      { s, t, a, tus: 500 },
    );
  }
}

