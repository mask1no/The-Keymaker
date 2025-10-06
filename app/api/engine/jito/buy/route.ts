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
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10000).default(150),
  tipLamports: z.number().min(0).optional(),
  region: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ny'),
  chunkSize: z.number().min(1).max(5).default(5),
  dryRun: z.boolean().default(true), // SAFE DEFAULT
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

/**
 * POST /api/engine/jito/buy
 * Execute Jito bundle buy across multiple wallets
 */
export async function POST(request: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const cfg = getRateConfig('submit');
    const rl = await rateLimit(`engine:jito_buy:${fwd || 'anon'}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
      return NextResponse.json({ error: 'live_disabled' }, { status: 503 });
    }
    // Require authenticated session and verify ownership
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json();
    const params = JitoBuySchema.parse(body);

    // Validate group
    const group = getWalletGroup(params.groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (!group.masterWallet || group.masterWallet !== user) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Deterministic order: dev -> snipers -> buyers
    const ordered: string[] = [];
    if (group.devWallet) ordered.push(group.devWallet);
    if (group.sniperWallets?.length) ordered.push(...group.sniperWallets);
    ordered.push(...group.executionWallets);
    const walletPubkeys = ordered.filter(Boolean);
    if (walletPubkeys.length === 0) {
      return NextResponse.json({ error: 'No execution wallets in group' }, { status: 400 });
    }

    // Load keypairs
    if (!group.masterWallet) {
      return NextResponse.json({ error: 'Group missing masterWallet' }, { status: 400 });
    }
    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
    if (keypairs.length === 0) {
      return NextResponse.json({ error: 'Failed to load wallet keypairs' }, { status: 500 });
    }

    // Enforce settings ceilings & LIVE gating
    const ui = getUiSettings();
    const envLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
    if (!params.dryRun) {
      if (!ui.liveMode || !envLive) {
        return NextResponse.json({ error: 'live_disabled' }, { status: 501 });
      }
      if ((process.env.KEYMAKER_REQUIRE_ARMING || '').toUpperCase() === 'YES') {
        const { isArmed } = await import('@/lib/server/arming');
        if (!isArmed()) return NextResponse.json({ error: 'not_armed' }, { status: 403 });
      }
    }
    // Enforce tip ceiling
    const tip = enforceTipCeiling(params.tipLamports ?? ui.tipLamports ?? 0, 200_000);

    // Build all transactions
    const transactions = await Promise.all(
      keypairs.map(async (wallet) => {
        return buildJupiterSwapTx({
          wallet,
          inputMint: 'So11111111111111111111111111111111111111112', // SOL
          outputMint: params.mint,
          amountSol: params.amountSol,
          slippageBps: params.slippageBps,
          cluster: params.cluster,
          priorityFeeMicrolamports:
            ui.priority === 'high' ? 800_000 : ui.priority === 'med' ? 300_000 : 0,
        });
      }),
    );

    // Execute bundle
    const result = await executeJitoBundle({
      transactions,
      tipLamports: tip,
      region: params.region,
      chunkSize: Math.min(5, Math.max(1, params.chunkSize)),
      dryRun: params.dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
