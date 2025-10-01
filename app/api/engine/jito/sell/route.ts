import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';
import { executeJitoBundle } from '@/lib/core/src/jitoBundle';
import { Connection } from '@solana/web3.js';
import { getSplTokenBalance } from '@/lib/core/src/balances';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JitoSellSchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  percent: z.number().min(1).max(100).default(100),
  slippageBps: z.number().min(0).max(10000).default(150),
  tipLamports: z.number().min(0).optional(),
  region: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ny'),
  chunkSize: z.number().min(1).max(5).default(5),
  dryRun: z.boolean().default(true),
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = JitoSellSchema.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    const walletPubkeys = group.executionWallets.slice(0); // copy
    if (walletPubkeys.length === 0) return NextResponse.json({ error: 'No execution wallets in group' }, { status: 400 });

    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0) return NextResponse.json({ error: 'Failed to load wallet keypairs' }, { status: 500 });
    const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const walletToAmount: Record<string, number> = {};
    for (const kp of keypairs) {
      const pub = kp.publicKey.toBase58();
      const { amount } = await getSplTokenBalance(connection, pub, params.mint);
      walletToAmount[pub] = Number(amount);
    }

    const transactions = await Promise.all(
      keypairs.map(async (wallet) =>
        buildJupiterSellTx({
          wallet,
          inputMint: params.mint,
          outputMint: 'So11111111111111111111111111111111111111112',
          amountTokens: Math.floor(((walletToAmount[wallet.publicKey.toBase58()] || 0) * params.percent) / 100),
          slippageBps: params.slippageBps,
          cluster: params.cluster,
        })
      )
    );

    const result = await executeJitoBundle({
      transactions,
      tipLamports: params.tipLamports,
      region: params.region,
      chunkSize: params.chunkSize,
      dryRun: params.dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


