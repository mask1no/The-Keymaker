import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { getDb } from '@/lib/db/sqlite';
import { readFileSync } from 'fs';

const fundSchema = z.object({
  groupId: z.string().uuid().optional(),
  walletPubkeys: z.array(z.string().min(32).max(44)).optional(),
  strategy: z.enum(['equal', 'per_wallet', 'target']),
  totalSol: z.number().positive().max(100).optional(),
  perWallet: z.number().positive().max(10).optional(),
  targetSol: z.number().positive().max(10).optional(),
  priorityFeeMicrolamports: z.number().int().nonnegative().default(10_000),
  dryRun: z.boolean().default(false),
});

function getPayerKeypair(): Keypair {
  const keypairPath = process.env.KEYPAIR_JSON || process.env.MASTER_WALLET_KEY;
  if (!keypairPath) {
    throw new Error('KEYPAIR_JSON or MASTER_WALLET_KEY env var not set');
  }
  const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(keypairData));
}

function getRpcUrl(): string {
  return process.env.HELIUS_RPC_URL || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { limit: rateLimitNum, windowMs } = getRateConfig('walletOps');
  const rateLimitResult = rateLimit(session.sub, rateLimitNum, windowMs);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const validated = fundSchema.parse(body);

    if (!validated.groupId && !validated.walletPubkeys) {
      return NextResponse.json(
        { error: 'Either groupId or walletPubkeys must be provided' },
        { status: 400 },
      );
    }

    const payer = getPayerKeypair();
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

    const amountsPerWallet: Map<string, number> = new Map();

    if (validated.strategy === 'per_wallet') {
      if (!validated.perWallet) {
        return NextResponse.json(
          { error: 'perWallet required for per_wallet strategy' },
          { status: 400 },
        );
      }
      walletPubkeys.forEach((pk) => amountsPerWallet.set(pk, validated.perWallet!));
    } else if (validated.strategy === 'equal') {
      if (!validated.totalSol) {
        return NextResponse.json(
          { error: 'totalSol required for equal strategy' },
          { status: 400 },
        );
      }
      const perWallet = validated.totalSol / walletPubkeys.length;
      walletPubkeys.forEach((pk) => amountsPerWallet.set(pk, perWallet));
    } else if (validated.strategy === 'target') {
      if (!validated.targetSol) {
        return NextResponse.json(
          { error: 'targetSol required for target strategy' },
          { status: 400 },
        );
      }

      for (const pk of walletPubkeys) {
        const pubkey = new PublicKey(pk);
        const balance = await connection.getBalance(pubkey);
        const balanceSol = balance / LAMPORTS_PER_SOL;
        const needed = Math.max(0, validated.targetSol - balanceSol);
        amountsPerWallet.set(pk, needed);
      }
    }

    if (validated.dryRun) {
      const preview = Array.from(amountsPerWallet.entries()).map(([wallet, amountSol]) => ({
        wallet,
        amountSol,
        amountLamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
      }));

      return NextResponse.json({
        success: true,
        mode: 'simulation',
        preview,
        totalSol: Array.from(amountsPerWallet.values()).reduce((sum, amt) => sum + amt, 0),
      });
    }

    const results = [];
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    const BATCH_SIZE = 10;

    const walletsToFund = Array.from(amountsPerWallet.entries()).filter(([, amt]) => amt > 0);

    for (let batchStart = 0; batchStart < walletsToFund.length; batchStart += BATCH_SIZE) {
      const batch = walletsToFund.slice(batchStart, batchStart + BATCH_SIZE);

      try {
        const instructions = [
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: validated.priorityFeeMicrolamports,
          }),
        ];

        for (const [pk, amountSol] of batch) {
          instructions.push(
            SystemProgram.transfer({
              fromPubkey: payer.publicKey,
              toPubkey: new PublicKey(pk),
              lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
            }),
          );
        }

        const message = TransactionMessage.compile({
          payerKey: payer.publicKey,
          instructions,
          recentBlockhash: blockhash,
        });

        const tx = new VersionedTransaction(message);
        tx.sign([payer]);

        const batchIdx = Math.floor(batchStart / BATCH_SIZE);
        const signature = await connection.sendTransaction(tx, {
          skipPreflight: false,
          maxRetries: 3,
        });

        await connection.confirmTransaction(signature, 'confirmed');

        for (const [pk, amountSol] of batch) {
          results.push({
            wallet: pk,
            success: true,
            signature,
            amountSol,
            memo: `fund:${Date.now()}:${batchIdx}`,
          });
        }

        console.log(`[fund] Batch ${batchIdx} completed`, {
          signature,
          wallets: batch.length,
        });
      } catch (error) {
        for (const [pk] of batch) {
          results.push({
            wallet: pk,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      if (batchStart + BATCH_SIZE < walletsToFund.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      mode: 'live',
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
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fund wallets' },
      { status: 500 },
    );
  }
}
