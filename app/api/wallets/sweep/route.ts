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
import { decrypt } from '@/lib/crypto';
import bs58 from 'bs58';
import { readFileSync } from 'fs';

const sweepSchema = z.object({
  groupId: z.string().uuid().optional(),
  walletPubkeys: z.array(z.string().min(32).max(44)).optional(),
  bufferSol: z.number().nonnegative().default(0.001),
  minThresholdSol: z.number().nonnegative().default(0.001),
  priorityFeeMicrolamports: z.number().int().nonnegative().default(10_000),
  dryRun: z.boolean().default(false),
});

function getMasterWallet(): PublicKey {
  const keypairPath = process.env.KEYPAIR_JSON || process.env.MASTER_WALLET_KEY;
  if (!keypairPath) {
    throw new Error('KEYPAIR_JSON or MASTER_WALLET_KEY env var not set');
  }
  const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  return keypair.publicKey;
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
    const validated = sweepSchema.parse(body);

    if (!validated.groupId && !validated.walletPubkeys) {
      return NextResponse.json(
        { error: 'Either groupId or walletPubkeys must be provided' },
        { status: 400 },
      );
    }

    const connection = new Connection(getRpcUrl(), 'confirmed');
    const db = getDb();
    const toPublicKey = getMasterWallet();

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

    const walletKeypairs: Keypair[] = [];

    for (const pubkey of walletPubkeys) {
      const walletRow = db.prepare('SELECT keypair FROM wallets WHERE address = ?').get(pubkey) as
        | { keypair: string }
        | undefined;

      if (!walletRow) {
        continue;
      }

      try {
        const decryptedKey = decrypt(walletRow.keypair, process.env.WALLET_PASSWORD || '');
        const keypair = Keypair.fromSecretKey(bs58.decode(decryptedKey));
        walletKeypairs.push(keypair);
      } catch {
        return NextResponse.json({ error: `Failed to decrypt wallet ${pubkey}` }, { status: 500 });
      }
    }

    const results = [];
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);

    for (let i = 0; i < walletKeypairs.length; i++) {
      const wallet = walletKeypairs[i];

      try {
        const balance = await connection.getBalance(wallet.publicKey);
        const bufferLamports = Math.floor(validated.bufferSol * LAMPORTS_PER_SOL);
        const sweepAmount = balance - bufferLamports - rentExemption - 5000;

        if (sweepAmount < validated.minThresholdSol * LAMPORTS_PER_SOL) {
          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: false,
            error: `Balance too low (${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL)`,
            balance: balance / LAMPORTS_PER_SOL,
          });
          continue;
        }

        if (validated.dryRun) {
          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: true,
            amountSol: sweepAmount / LAMPORTS_PER_SOL,
            balance: balance / LAMPORTS_PER_SOL,
          });
          continue;
        }

        const { blockhash } = await connection.getLatestBlockhash('confirmed');

        const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: validated.priorityFeeMicrolamports,
        });

        const transferIx = SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: toPublicKey,
          lamports: sweepAmount,
        });

        const message = TransactionMessage.compile({
          payerKey: wallet.publicKey,
          instructions: [computeBudgetIx, transferIx],
          recentBlockhash: blockhash,
        });

        const tx = new VersionedTransaction(message);
        tx.sign([wallet]);

        const signature = await connection.sendTransaction(tx, {
          skipPreflight: false,
          maxRetries: 3,
        });

        await connection.confirmTransaction(signature, 'confirmed');

        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          signature,
          amountSol: sweepAmount / LAMPORTS_PER_SOL,
          memo: `sweep:${Date.now()}:${i}`,
        });

        console.log('[sweep] Success', {
          from: wallet.publicKey.toBase58(),
          to: toPublicKey.toBase58(),
          amount: sweepAmount / LAMPORTS_PER_SOL,
          signature,
        });
      } catch (error) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

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
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sweep wallets' },
      { status: 500 },
    );
  }
}
