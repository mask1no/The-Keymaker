import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  SystemProgram,
} from '@solana/web3.js';
import {
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
  createSyncNativeInstruction,
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { getDb } from '@/lib/db/sqlite';
import { decrypt } from '@/lib/crypto';
import bs58 from 'bs58';

const deepcleanSchema = z.object({
  groupId: z.string().uuid().optional(),
  walletPubkeys: z.array(z.string().min(32).max(44)).optional(),
  closeEmptyAtas: z.boolean().default(true),
  unwrapWsol: z.boolean().default(true),
  minTokenLamports: z.number().int().nonnegative().default(1000),
  dryRun: z.boolean().default(false),
});

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
    const validated = deepcleanSchema.parse(body);

    if (!validated.groupId && !validated.walletPubkeys) {
      return NextResponse.json(
        { error: 'Either groupId or walletPubkeys must be provided' },
        { status: 400 },
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

    for (const wallet of walletKeypairs) {
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const closeInstructions = [];
        let atasToClose = 0;
        let wsolUnwrapped = false;

        for (const accountInfo of tokenAccounts.value) {
          const accountData = accountInfo.account.data.parsed.info;
          const balance = accountData.tokenAmount.amount;
          const mint = accountData.mint;

          if (validated.unwrapWsol && mint === NATIVE_MINT.toBase58() && Number(balance) > 0) {
            closeInstructions.push(
              createCloseAccountInstruction(accountInfo.pubkey, wallet.publicKey, wallet.publicKey),
            );
            wsolUnwrapped = true;
            atasToClose++;
          } else if (validated.closeEmptyAtas && Number(balance) < validated.minTokenLamports) {
            closeInstructions.push(
              createCloseAccountInstruction(accountInfo.pubkey, wallet.publicKey, wallet.publicKey),
            );
            atasToClose++;
          }
        }

        if (validated.dryRun) {
          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: true,
            atasToClose,
            wsolUnwrapped,
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
            instructions: [computeBudgetIx, ...closeInstructions.slice(0, 15)],
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
            atasClosed: atasToClose,
            wsolUnwrapped,
          });

          console.log('[deepclean] Success', {
            wallet: wallet.publicKey.toBase58(),
            atasClosed: atasToClose,
            wsolUnwrapped,
            signature,
          });
        } else {
          results.push({
            wallet: wallet.publicKey.toBase58(),
            success: true,
            message: 'No ATAs to close',
          });
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
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deep clean wallets' },
      { status: 500 },
    );
  }
}
