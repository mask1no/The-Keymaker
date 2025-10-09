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
import { readFileSync } from 'fs';
import { logger } from '@/lib/logger';

const fundSchema = z.object({
  walletPubkeys: z.array(z.string().min(32).max(44)).min(1).max(20),
  strategy: z.enum(['equal', 'per_wallet', 'target']).default('equal'),
  totalSol: z.number().positive().max(100).optional(),
  perWalletSol: z.number().positive().max(10).optional(),
  priorityFeeMicroLamports: z.number().int().nonnegative().default(10_000),
  dryRun: z.boolean().default(false),
});

function getPayerKeypair(): Keypair {
  const keypairPath = process.env.KEYPAIR_JSON;
  if (!keypairPath) {
    throw new Error('KEYPAIR_JSON env var not set');
  }
  const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(keypairData));
}

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
    const validated = fundSchema.parse(body);

    const payer = getPayerKeypair();
    const connection = new Connection(getRpcUrl(), 'confirmed');

    const amountsPerWallet: number[] = [];

    if (validated.strategy === 'per_wallet') {
      if (!validated.perWalletSol) {
        return NextResponse.json({ error: 'perWalletSol required for per_wallet strategy' }, { status: 400 });
      }
      for (let i = 0; i < validated.walletPubkeys.length; i++) {
        amountsPerWallet.push(validated.perWalletSol);
      }
    } else if (validated.strategy === 'equal') {
      if (!validated.totalSol) {
        return NextResponse.json({ error: 'totalSol required for equal strategy' }, { status: 400 });
      }
      const perWallet = validated.totalSol / validated.walletPubkeys.length;
      for (let i = 0; i < validated.walletPubkeys.length; i++) {
        amountsPerWallet.push(perWallet);
      }
    }

    if (validated.dryRun) {
      const preview = validated.walletPubkeys.map((pubkey, i) => ({
        wallet: pubkey,
        amountSol: amountsPerWallet[i],
        amountLamports: Math.floor(amountsPerWallet[i] * LAMPORTS_PER_SOL),
      }));

      return NextResponse.json({
        success: true,
        mode: 'simulation',
        preview,
        totalSol: amountsPerWallet.reduce((sum, amt) => sum + amt, 0),
      });
    }

    const results = [];
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    for (let i = 0; i < validated.walletPubkeys.length; i++) {
      try {
        const toPubkey = new PublicKey(validated.walletPubkeys[i]);
        const lamports = Math.floor(amountsPerWallet[i] * LAMPORTS_PER_SOL);

        const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: validated.priorityFeeMicroLamports,
        });

        const transferIx = SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey,
          lamports,
        });

        const message = TransactionMessage.compile({
          payerKey: payer.publicKey,
          instructions: [computeBudgetIx, transferIx],
          recentBlockhash: blockhash,
        });

        const tx = new VersionedTransaction(message);
        tx.sign([payer]);

        const signature = await connection.sendTransaction(tx, {
          skipPreflight: false,
          maxRetries: 3,
        });

        await connection.confirmTransaction(signature, 'confirmed');

        results.push({
          wallet: validated.walletPubkeys[i],
          success: true,
          signature,
          amountSol: amountsPerWallet[i],
        });

        logger.info('Wallet funded', {
          to: validated.walletPubkeys[i],
          amount: amountsPerWallet[i],
          signature,
        });
      } catch (error) {
        results.push({
          wallet: validated.walletPubkeys[i],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
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
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Wallet funding failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fund wallets' },
      { status: 500 }
    );
  }
});
