import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSwapTx } from '@/lib/core/src/jupiterAdapter';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { getUiSettings } from '@/lib/server/settings';
import { enforcePriorityFeeCeiling, enforceConcurrencyCeiling } from '@/lib/server/productionGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RpcBuySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10000).default(150),
  priorityFeeMicrolamports: z.number().min(0).optional(),
  concurrency: z.number().min(1).max(20).default(5),
  dryRun: z.boolean().default(true),
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

export async function POST(request: Request) {
  try {
    if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
      return NextResponse.json({ error: 'live_disabled' }, { status: 503 });
    }
    const body = await request.json();
    const params = RpcBuySchema.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const walletPubkeys = group.executionWallets;
    if (walletPubkeys.length === 0) return NextResponse.json({ error: 'No execution wallets in group' }, { status: 400 });

    if (!group.masterWallet) return NextResponse.json({ error: 'Group missing masterWallet' }, { status: 400 });
    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0) return NextResponse.json({ error: 'Failed to load wallet keypairs' }, { status: 500 });

    // Read UI settings only if needed later
    const pri = enforcePriorityFeeCeiling(params.priorityFeeMicrolamports || 0, 1_000_000);
    const conc = enforceConcurrencyCeiling(params.concurrency, 16);
    const result = await executeRpcFanout({
      wallets: keypairs,
      concurrency: conc,
      priorityFeeMicrolamports: pri,
      dryRun: params.dryRun,
      cluster: params.cluster,
      intentHash: `buy:${params.mint}:${params.amountSol}:${params.slippageBps}`,
      buildTx: async (wallet) =>
        buildJupiterSwapTx({
          wallet,
          inputMint: 'So11111111111111111111111111111111111111112',
          outputMint: params.mint,
          amountSol: params.amountSol,
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

// Removed duplicate legacy handler block to ensure Jupiter swaps are used above.
