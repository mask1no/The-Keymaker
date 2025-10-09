import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { Connection, Keypair } from '@solana/web3.js';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { multiWalletBuy } from '@/lib/engine/trade';
import { getDb } from '@/lib/db/sqlite';
import bs58 from 'bs58';
import { decrypt } from '@/lib/crypto';

const buySchema = z.object({
  groupId: z.string().uuid().optional(),
  walletPubkeys: z.array(z.string().min(32).max(44)).optional(),
  mint: z.string().min(32).max(44),
  perWalletSol: z.number().positive().max(10),
  slippageBps: z.number().int().min(0).max(10000).default(300),
  impactCapPct: z.number().positive().max(50).optional(),
  priorityFeeMicrolamports: z.number().int().nonnegative().optional(),
  dryRun: z.boolean().default(false),
});

function getRpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.RPC_URL ||
    'https://api.mainnet-beta.solana.com'
  );
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { limit: rateLimit: rateLimitNum, windowMs } = getRateConfig('submit');
  const rateLimitResult = rateLimit(session.sub, rateLimitNum, windowMs);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const validated = buySchema.parse(body);

    if (!validated.groupId && !validated.walletPubkeys) {
      return NextResponse.json(
        { error: 'Either groupId or walletPubkeys must be provided' },
        { status: 400 }
      );
    }

    const connection = new Connection(getRpcUrl(), 'confirmed');
    const db = getDb();

    let walletPubkeys: string[] = [];

    if (validated.groupId) {
      const group = db
        .prepare('SELECT wallet_pubkeys FROM wallet_groups WHERE id = ?')
        .get(validated.groupId) as { wallet_pubkeys: string } | undefined;

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      walletPubkeys = JSON.parse(group.wallet_pubkeys);
    } else if (validated.walletPubkeys) {
      walletPubkeys = validated.walletPubkeys;
    }

    const devMintRow = db
      .prepare('SELECT dev_wallet FROM dev_mints WHERE mint = ?')
      .get(validated.mint) as { dev_wallet: string } | undefined;

    if (devMintRow) {
      walletPubkeys = walletPubkeys.filter((pk) => pk !== devMintRow.dev_wallet);
    }

    if (walletPubkeys.length === 0) {
      return NextResponse.json({ error: 'No valid wallets to trade' }, { status: 400 });
    }

    const walletKeypairs: Keypair[] = [];

    for (const pubkey of walletPubkeys) {
      const walletRow = db
        .prepare('SELECT keypair FROM wallets WHERE address = ?')
        .get(pubkey) as { keypair: string } | undefined;

      if (!walletRow) {
        return NextResponse.json(
          { error: `Wallet ${pubkey} not found` },
          { status: 404 }
        );
      }

      try {
        const decryptedKey = decrypt(walletRow.keypair, process.env.WALLET_PASSWORD || '');
        const keypair = Keypair.fromSecretKey(bs58.decode(decryptedKey));
        walletKeypairs.push(keypair);
      } catch {
        return NextResponse.json(
          { error: `Failed to decrypt wallet ${pubkey}` },
          { status: 500 }
        );
      }
    }

    const results = await multiWalletBuy({
      mint: validated.mint,
      wallets: walletKeypairs,
      perWalletSolLamports: Math.floor(validated.perWalletSol * 1e9),
      slippageBps: validated.slippageBps,
      impactCapPct: validated.impactCapPct,
      priorityFeeMicrolamports: validated.priorityFeeMicrolamports,
      dryRun: validated.dryRun,
    });

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      mode: validated.dryRun ? 'simulation' : 'live',
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute buy',
      },
      { status: 500 }
    );
  }
}

