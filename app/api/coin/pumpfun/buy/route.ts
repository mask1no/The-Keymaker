import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { buildBuyTx } from '@/lib/tx/pumpfun';

export const dynamic = 'force-dynamic';

const Body = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10_000).default(150),
  priorityFeeMicrolamports: z.number().min(0).optional(),
  concurrency: z.number().min(1).max(20).default(5),
});

export async function POST(request: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const cfg = getRateConfig('submit');
    const rl = await rateLimit(`coin:pumpfun_buy:${fwd || 'anon'}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    const session = getSession(request);
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json();
    const params = Body.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (!group.masterWallet || group.masterWallet !== user) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const walletPubkeys = group.executionWallets;
    if (walletPubkeys.length === 0)
      return NextResponse.json({ error: 'No execution wallets in group' }, { status: 400 });

    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0)
      return NextResponse.json({ error: 'Failed to load wallet keypairs' }, { status: 500 });

    const result = await executeRpcFanout({
      wallets: keypairs,
      concurrency: Math.min(16, Math.max(1, params.concurrency)),
      priorityFeeMicrolamports: params.priorityFeeMicrolamports || 0,
      dryRun: false,
      cluster: 'mainnet-beta',
      intentHash: `pumpfun_buy:${params.groupId}:${params.mint}:${params.amountSol}:${params.slippageBps}`,
      buildTx: async (wallet) =>
        buildBuyTx({
          buyer: wallet,
          mint: params.mint,
          solLamports: Math.floor(params.amountSol * 1e9),
          slippageBps: params.slippageBps,
          priorityFeeMicrolamports: params.priorityFeeMicrolamports,
        }),
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = (e as Error)?.message || 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
