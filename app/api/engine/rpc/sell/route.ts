import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { getUiSettings } from '@/lib/server/settings';
import { enforcePriorityFeeCeiling, enforceConcurrencyCeiling } from '@/lib/server/productionGuards';
import { Connection } from '@solana/web3.js';
import { getSplTokenBalance } from '@/lib/core/src/balances';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RpcSellSchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  percent: z.number().min(1).max(100).default(100),
  afterMs: z.number().min(0).optional(),
  slippageBps: z.number().min(0).max(10000).default(150),
  priorityFeeMicrolamports: z.number().min(0).optional(),
  concurrency: z.number().min(1).max(20).default(5),
  dryRun: z.boolean().default(true),
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
  wallets: z.array(z.string().min(32).max(44)).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = RpcSellSchema.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const walletPubkeys = params.wallets && params.wallets.length > 0
      ? group.executionWallets.filter((w) => params.wallets!.includes(w))
      : group.executionWallets;
    if (walletPubkeys.length === 0) return NextResponse.json({ error: 'No execution wallets in group' }, { status: 400 });

    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0) return NextResponse.json({ error: 'Failed to load wallet keypairs' }, { status: 500 });

    // Resolve per-wallet token balances for the input mint
    const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const walletToAmount: Record<string, number> = {};
    for (const kp of keypairs) {
      const pub = kp.publicKey.toBase58();
      const { amount } = await getSplTokenBalance(connection, pub, params.mint);
      walletToAmount[pub] = Number(amount);
    }

    if (params.afterMs && params.afterMs > 0) {
      await new Promise((r) => setTimeout(r, Math.min(params.afterMs, 60_000)));
    }

    const ui = getUiSettings();
    const pri = enforcePriorityFeeCeiling(params.priorityFeeMicrolamports || 0, 1_000_000);
    const conc = enforceConcurrencyCeiling(params.concurrency, 16);
    const result = await executeRpcFanout({
      wallets: keypairs,
      concurrency: conc,
      priorityFeeMicrolamports: pri,
      dryRun: params.dryRun,
      cluster: params.cluster,
      intentHash: `sell:${params.mint}:${params.percent}:${params.slippageBps}`,
      buildTx: async (wallet) =>
        buildJupiterSellTx({
          wallet,
          inputMint: params.mint,
          outputMint: 'So11111111111111111111111111111111111111112',
          amountTokens: Math.floor(((walletToAmount[wallet.publicKey.toBase58()] || 0) * params.percent) / 100),
          slippageBps: params.slippageBps,
          cluster: params.cluster,
          priorityFeeMicrolamports: params.priorityFeeMicrolamports,
        }),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


