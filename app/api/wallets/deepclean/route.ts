import { NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { getDb } from '@/lib/db/sqlite';
import { decrypt } from '@/lib/crypto';
import bs58 from 'bs58';
import { logger } from '@/lib/logger';
import { readFileSync } from 'fs';

const deepcleanSchema = z.object({
  walletPubkeys: z.array(z.string().min(32).max(44)).min(1).max(20),
  closeEmptyAtas: z.boolean().default(true),
  unwrapWsol: z.boolean().default(true),
  minTokenLamports: z.number().int().nonnegative().default(1000),
  password: z.string().min(1),
  deleteFromDb: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

function getRpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
}

function getPayerKeypair(): Keypair {
  const keypairPath = process.env.KEYPAIR_JSON;
  if (!keypairPath) {
    throw new Error('KEYPAIR_JSON env var not set');
  }
  const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(keypairData));
}

export const POST = withSessionAndLimit(async (request) => {
  try {
    const body = await request.json();
    const validated = deepcleanSchema.parse(body);

    const connection = new Connection(getRpcUrl(), 'confirmed');
    const db = await getDb();
    const payer = getPayerKeypair();

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

    for (const wallet of walletKeypairs) {
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const closeInstructions = [];
        let atasToClose = 0;

        for (const accountInfo of tokenAccounts.value) {
          const balance = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;

          if (validated.closeEmptyAtas && balance === 0) {
            closeInstructions.push(
              createCloseAccountInstruction(
                accountInfo.pubkey,
                payer.publicKey,
                wallet.publicKey
              )
            );
            atasToClose++;
          }
        }

        if (validated.dryRun) {
          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: true,
            atasToClose,
          });
          continue;
        }

        if (closeInstructions.length > 0) {
          const { blockhash } = await connection.getLatestBlockhash('confirmed');

          const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 10_000,
          });

          const message = TransactionMessage.compile({
            payerKey: wallet.publicKey,
            instructions: [computeBudgetIx, ...closeInstructions.slice(0, 10)],
            recentBlockhash: blockhash,
          });

          const tx = new VersionedTransaction(message);
          tx.sign([wallet]);

          const signature = await connection.sendTransaction(tx);
          await connection.confirmTransaction(signature, 'confirmed');

          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: true,
            signature,
            atasClosed: atasToClose,
          });

          logger.info('Wallet deep-cleaned', {
            wallet: wallet.publicKey.toBase58(),
            atasClosed: atasToClose,
            signature,
          });
        } else {
          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: true,
            message: 'No ATAs to close',
          });
        }

        if (validated.deleteFromDb && !validated.dryRun) {
          await db.run('DELETE FROM wallets WHERE address = ?', [wallet.publicKey.toBase58()]);
        }
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
    logger.error('Deep clean failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deep clean wallets' },
      { status: 500 }
    );
  }
});
