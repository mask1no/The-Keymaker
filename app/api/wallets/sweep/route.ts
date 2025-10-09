import { NextResponse } from 'next/server';
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
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { getDb } from '@/lib/db/sqlite';
import { decrypt } from '@/lib/crypto';
import bs58 from 'bs58';
import { logger } from '@/lib/logger';

const sweepSchema = z.object({
  walletPubkeys: z.array(z.string().min(32).max(44)).min(1).max(20),
  toAddress: z.string().min(32).max(44),
  bufferSol: z.number().nonnegative().default(0.001),
  minThresholdSol: z.number().nonnegative().default(0.001),
  password: z.string().min(1),
  priorityFeeMicroLamports: z.number().int().nonnegative().default(10_000),
  dryRun: z.boolean().default(false),
});

function getRpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
}

export const POST = withSessionAndLimit(async (request) => {
  try {
    const body = await request.json();
    const validated = sweepSchema.parse(body);

    const connection = new Connection(getRpcUrl(), 'confirmed');
    const db = await getDb();
    const toPublicKey = new PublicKey(validated.toAddress);

    const walletKeypairs: Keypair[] = [];

    for (const pubkey of validated.walletPubkeys) {
      const wallet = await db.get('SELECT * FROM wallets WHERE address = ?', [pubkey]);

      if (!wallet) {
        continue;
      }

      try {
        const decryptedKey = decrypt(wallet.keypair, validated.password);
        const keypair = Keypair.fromSecretKey(bs58.decode(decryptedKey));
        walletKeypairs.push(keypair);
      } catch {
        return NextResponse.json(
          { error: `Invalid password for wallet ${pubkey}` },
          { status: 401 }
        );
      }
    }

    const results = [];
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);

    for (const wallet of walletKeypairs) {
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
          microLamports: validated.priorityFeeMicroLamports,
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
        });

        logger.info('Wallet swept', {
          from: wallet.publicKey.toBase58(),
          to: validated.toAddress,
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
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Wallet sweep failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sweep wallets' },
      { status: 500 }
    );
  }
});
