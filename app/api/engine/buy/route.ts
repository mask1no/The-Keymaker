import { NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { Connection, Keypair } from '@solana/web3.js';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { multiWalletBuy } from '@/lib/engine/trade';
import { getDb } from '@/lib/db/sqlite';
import bs58 from 'bs58';
import { decrypt } from '@/lib/crypto';

const buySchema = z.object({
  mint: z.string().min(32).max(44),
  walletPubkeys: z.array(z.string().min(32).max(44)).min(1).max(20),
  perWalletSol: z.number().positive().max(10),
  slippageBps: z.number().int().min(0).max(10000).default(300),
  impactCapPct: z.number().positive().max(50).default(5),
  priorityFeeMicrolamports: z.number().int().nonnegative().default(50_000),
  password: z.string().min(1),
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
    const validated = buySchema.parse(body);

    const connection = new Connection(getRpcUrl(), 'confirmed');
    const db = await getDb();

    // Load and decrypt wallets
    const walletKeypairs: Keypair[] = [];

    for (const pubkey of validated.walletPubkeys) {
      const wallet = await db.get('SELECT * FROM wallets WHERE address = ?', [pubkey]);

      if (!wallet) {
        return NextResponse.json({ error: `Wallet ${pubkey} not found` }, { status: 404 });
      }

      try {
        const decryptedKey = decrypt(wallet.keypair, validated.password);
        const keypair = Keypair.fromSecretKey(bs58.decode(decryptedKey));
        walletKeypairs.push(keypair);
      } catch {
        return NextResponse.json(
          { error: `Invalid password for wallet ${pubkey}` },
          { status: 401 },
        );
      }
    }

    // Execute multi-wallet buy
    const results = await multiWalletBuy({
      mint: validated.mint,
      wallets: walletKeypairs,
      perWalletSolLamports: Math.floor(validated.perWalletSol * 1e9),
      slippageBps: validated.slippageBps,
      impactCapPct: validated.impactCapPct,
      priorityFeeMicrolamports: validated.priorityFeeMicrolamports,
      connection,
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
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute buy',
      },
      { status: 500 },
    );
  }
});
