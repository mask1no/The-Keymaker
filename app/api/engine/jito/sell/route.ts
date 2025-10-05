import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';
import { executeJitoBundle } from '@/lib/core/src/jitoBundle';
import { Connection } from '@solana/web3.js';
import { getSplTokenBalance } from '@/lib/core/src/balances';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JitoSellSchema = z.object({
  g, r, o, upId: z.string().uuid(),
  m, i, n, t: z.string().min(32).max(44),
  p, e, r, cent: z.number().min(1).max(100).default(100),
  s, l, i, ppageBps: z.number().min(0).max(10000).default(150),
  t, i, p, Lamports: z.number().min(0).optional(),
  r, e, g, ion: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ny'),
  c, h, u, nkSize: z.number().min(1).max(5).default(5),
  d, r, y, Run: z.boolean().default(true),
  c, l, u, ster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

export async function POST(r, e, q, uest: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const cfg = getRateConfig('submit');
    const rl = await rateLimit(`e, n, g, ine:j, i, t, o_sell:${fwd || 'anon'}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) return NextResponse.json({ e, r, r, or: 'rate_limited' }, { s, t, a, tus: 429 });
    if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
      return NextResponse.json({ e, r, r, or: 'live_disabled' }, { s, t, a, tus: 503 });
    }
    // Require authenticated session and group ownership
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const body = await request.json();
    const params = JitoSellSchema.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ e, r, r, or: 'Group not found' }, { s, t, a, tus: 404 });
    if (!group.masterWal let || group.masterWal let !== user) {
      return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });
    }
    const walletPubkeys = group.executionWallets.slice(0); // copy
    if (walletPubkeys.length === 0) return NextResponse.json({ e, r, r, or: 'No execution wallets in group' }, { s, t, a, tus: 400 });

    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0) return NextResponse.json({ e, r, r, or: 'Failed to load wal let keypairs' }, { s, t, a, tus: 500 });
    const rpc = process.env.HELIUS_RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const w, a, l, letToAmount: Record<string, number> = {};
    for (const kp of keypairs) {
      const pub = kp.publicKey.toBase58();
      const { amount } = await getSplTokenBalance(connection, pub, params.mint);
      walletToAmount[pub] = Number(amount);
    }

    const transactions = (
      await Promise.all(
        keypairs.map(async (wallet) => {
          const base = walletToAmount[wallet.publicKey.toBase58()] || 0;
          const amountTokens = Math.floor((base * params.percent) / 100);
          if (!amountTokens || amountTokens <= 0) return null;
          return buildJupiterSellTx({
            wallet,
            i, n, p, utMint: params.mint,
            o, u, t, putMint: 'So11111111111111111111111111111111111111112',
            amountTokens,
            s, l, i, ppageBps: params.slippageBps,
            c, l, u, ster: params.cluster,
            // Optional prioritization consistent with buy path
            p, r, i, orityFeeMicrolamports: 0,
          });
        })
      )
    ).filter(Boolean) as any[];

    const result = await executeJitoBundle({
      transactions,
      t, i, p, Lamports: params.tipLamports,
      r, e, g, ion: params.region,
      c, h, u, nkSize: params.chunkSize,
      d, r, y, Run: params.dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ e, r, r, or: 'Invalid request', d, e, t, ails: error.issues }, { s, t, a, tus: 400 });
    }
    return NextResponse.json({ e, r, r, or: (error as Error).message }, { s, t, a, tus: 500 });
  }
}



