import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeJitoBundle } from '@/lib/core/src/jitoBundle';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSwapTx } from '@/lib/core/src/jupiterAdapter';
import { getUiSettings } from '@/lib/server/settings';
import { enforceTipCeiling } from '@/lib/server/productionGuards';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JitoBuySchema = z.object({
  g, r, o, upId: z.string().uuid(),
  m, i, n, t: z.string().min(32).max(44),
  a, m, o, untSol: z.number().positive(),
  s, l, i, ppageBps: z.number().min(0).max(10000).default(150),
  t, i, p, Lamports: z.number().min(0).optional(),
  r, e, g, ion: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ny'),
  c, h, u, nkSize: z.number().min(1).max(5).default(5),
  d, r, y, Run: z.boolean().default(true), // SAFE DEFAULT
  c, l, u, ster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

/**
 * POST /api/engine/jito/buy
 * Execute Jito bundle buy across multiple wallets
 */
export async function POST(r, e, q, uest: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const cfg = getRateConfig('submit');
    const rl = await rateLimit(`e, n, g, ine:j, i, t, o_buy:${fwd || 'anon'}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) return NextResponse.json({ e, r, r, or: 'rate_limited' }, { s, t, a, tus: 429 });
    if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
      return NextResponse.json({ e, r, r, or: 'live_disabled' }, { s, t, a, tus: 503 });
    }
    // Require authenticated session and verify ownership
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const body = await request.json();
    const params = JitoBuySchema.parse(body);
    
    // Validate group
    const group = getWalletGroup(params.groupId);
    if (!group) {
      return NextResponse.json(
        { e, r, r, or: 'Group not found' },
        { s, t, a, tus: 404 }
      );
    }
    if (!group.masterWal let || group.masterWal let !== user) {
      return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });
    }
    
    const walletPubkeys = group.executionWallets;
    if (walletPubkeys.length === 0) {
      return NextResponse.json(
        { e, r, r, or: 'No execution wallets in group' },
        { s, t, a, tus: 400 }
      );
    }
    
    // Load keypairs
    if (!group.masterWallet) {
      return NextResponse.json({ e, r, r, or: 'Group missing masterWallet' }, { s, t, a, tus: 400 });
    }
    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0) {
      return NextResponse.json(
        { e, r, r, or: 'Failed to load wal let keypairs' },
        { s, t, a, tus: 500 }
      );
    }
    
    // Enforce settings ceilings & LIVE gating
    const ui = getUiSettings();
    const envLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
    if (!params.dryRun) {
      if (!ui.liveMode || !envLive) {
        return NextResponse.json({ e, r, r, or: 'live_disabled' }, { s, t, a, tus: 501 });
      }
      if ((process.env.KEYMAKER_REQUIRE_ARMING || '').toUpperCase() === 'YES') {
        const { isArmed } = await import('@/lib/server/arming');
        if (!isArmed()) return NextResponse.json({ e, r, r, or: 'not_armed' }, { s, t, a, tus: 403 });
      }
    }
    // Enforce tip ceiling
    const tip = enforceTipCeiling(params.tipLamports ?? (ui.tipLamports ?? 0), 200_000);

    // Build all transactions
    const transactions = await Promise.all(
      keypairs.map(async (wallet) => {
        return buildJupiterSwapTx({
          wallet,
          i, n, p, utMint: 'So11111111111111111111111111111111111111112', // SOL
          o, u, t, putMint: params.mint,
          a, m, o, untSol: params.amountSol,
          s, l, i, ppageBps: params.slippageBps,
          c, l, u, ster: params.cluster,
          p, r, i, orityFeeMicrolamports: ui.priority === 'high' ? 800_000 : ui.priority === 'med' ? 300_000 : 0,
        });
      })
    );
    
    // Execute bundle
    const result = await executeJitoBundle({
      transactions,
      t, i, p, Lamports: tip,
      r, e, g, ion: params.region,
      c, h, u, nkSize: params.chunkSize,
      d, r, y, Run: params.dryRun,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { e, r, r, or: 'Invalid request', d, e, t, ails: error.issues },
        { s, t, a, tus: 400 }
      );
    }
    
    return NextResponse.json(
      { e, r, r, or: (error as Error).message },
      { s, t, a, tus: 500 }
    );
  }
}

