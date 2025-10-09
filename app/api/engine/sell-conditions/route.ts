import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { rateLimit } from '@/lib/server/rateLimit';
import { getUiSettings } from '@/lib/server/settings';
import {
  enforceConcurrencyCeiling,
  enforcePriorityFeeCeiling,
} from '@/lib/server/productionGuards';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { Connection } from '@solana/web3.js';
import { getSplTokenBalance } from '@/lib/core/src/balances';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';
import {
  evaluateSellConditions,
  calculateSellAmount,
  type SellCondition,
  type PercentTargetParams,
  type StopLossParams,
} from '@/lib/core/src/sellConditions';
import { promises as fsp } from 'fs';
import { join } from 'path';
import { journalTrade } from '@/lib/core/src/journal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CRUD for durable storage
export async function GET(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId') || undefined;
    const mint = url.searchParams.get('mint') || undefined;
    const dir = join(process.cwd(), 'data', user);
    const file = join(dir, 'sell-conditions.json');
    interface SellConditionItem {
      groupId?: string;
      mint?: string;
      [key: string]: unknown;
    }

    let items: SellConditionItem[] = [];
    try {
      const raw = await fsp.readFile(file, 'utf8');
      items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [];
    } catch {}
    const filtered = items.filter(
      (e: SellConditionItem) => (!groupId || e.groupId === groupId) && (!mint || e.mint === mint),
    );
    return NextResponse.json({ ok: true, items: filtered });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

const ConditionSchema = z.object({
  id: z.string(),
  type: z.enum(['percent_target', 'time_limit', 'stop_loss']),
  enabled: z.boolean().default(true),
  params: z.record(z.string(), z.number()),
});

const BodySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  // Entry price in lamports per token (for percent targets/SL if provided by client)
  entryPriceLamportsPerToken: z.number().min(0).optional(),
  conditions: z.array(ConditionSchema).min(1),
  slippageBps: z.number().min(0).max(10_000).default(150),
  priorityFeeMicrolamports: z.number().min(0).optional(),
  concurrency: z.number().min(1).max(20).default(5),
  dryRun: z.boolean().default(true),
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

async function fetchCurrentPriceLamportsPerToken(mint: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/market/${encodeURIComponent(mint)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const lpt =
      typeof j?.lamportsPerToken === 'string'
        ? Number(j.lamportsPerToken)
        : typeof j?.lamportsPerToken === 'number'
          ? j.lamportsPerToken
          : 0;
    return Number.isFinite(lpt) && lpt > 0 ? lpt : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const rl = await rateLimit(`engine:sellconds:${fwd || 'anon'}`);
    if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

    // Session
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await request.json();
    const params = BodySchema.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    if (!group.masterWallet || group.masterWallet !== user) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // LIVE gating
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

    // Price info (fallback to provided entry price)
    const currentPrice = await fetchCurrentPriceLamportsPerToken(params.mint);
    const entryPrice = params.entryPriceLamportsPerToken || currentPrice || 0;
    const priceInfo = {
      entryPrice,
      currentPrice: currentPrice ?? entryPrice,
      changePercent:
        entryPrice > 0 && currentPrice != null
          ? ((currentPrice - entryPrice) / entryPrice) * 100
          : 0,
    };

    // Evaluate
    const enabledConds: SellCondition[] = params.conditions.map((c) => ({
      id: c.id,
      type: c.type,
      enabled: c.enabled,
      params: c.params as Record<string, unknown>,
    }));
    const triggered = evaluateSellConditions({ conditions: enabledConds, priceInfo });

    // Time-limit scheduling (fire-and-forget)
    const scheduled: Array<{ id: string; afterMs: number; percent: number }> = [];
    for (const c of enabledConds) {
      if (c.enabled && c.type === 'time_limit') {
        const afterMs = Number((c.params as Record<string, unknown>)?.delayMs || 0);
        const percent = Number((c.params as Record<string, unknown>)?.sellPercent || 0);
        if (afterMs > 0 && percent > 0) {
          scheduled.push({ id: c.id, afterMs, percent });
          // Schedule RPC sell with percent after delay
          setTimeout(
            async () => {
              try {
                await triggerSell(group.id, params.mint, percent, params);
              } catch {}
            },
            Math.min(afterMs, 60_000),
          );
        }
      }
    }

    // Immediate triggers (percent_target / stop_loss)
    const executed: Array<{ id: string; percent: number }> = [];
    for (const c of triggered) {
      const percent = Number((c.params as Record<string, unknown>)?.sellPercent || 0);
      if (percent > 0) {
        await triggerSell(group.id, params.mint, percent, params);
        executed.push({ id: c.id, percent });
      }
    }

    // Persist to disk for durability
    await persistConditions({
      user,
      groupId: params.groupId,
      mint: params.mint,
      conditions: enabledConds,
    });

    return NextResponse.json({
      ok: true,
      evaluated: { triggered: triggered.map((t) => t.id) },
      executed,
      scheduled,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

async function triggerSell(
  groupId: string,
  mint: string,
  percent: number,
  base: z.infer<typeof BodySchema>,
) {
  const group = getWalletGroup(groupId)!;
  const walletPubkeys = group.executionWallets;
  const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
  if (keypairs.length === 0) throw new Error('no_wallets');
  const rpc = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpc, 'confirmed');
  const walletToAmount: Record<string, number> = {};
  for (const kp of keypairs) {
    const pub = kp.publicKey.toBase58();
    const { amount } = await getSplTokenBalance(connection, pub, mint);
    walletToAmount[pub] = Number(amount);
  }
  // Ceilings & opts
  const pri = enforcePriorityFeeCeiling(base.priorityFeeMicrolamports || 0, 1_000_000);
  const conc = enforceConcurrencyCeiling(base.concurrency, 16);
  await executeRpcFanout({
    wallets: keypairs,
    concurrency: conc,
    priorityFeeMicrolamports: pri,
    dryRun: base.dryRun,
    cluster: base.cluster,
    intentHash: `sell:${groupId}:${mint}:${percent}:${base.slippageBps}`,
    buildTx: async (wallet) => {
      const baseAmt = walletToAmount[wallet.publicKey.toBase58()] || 0;
      const amountTokens = Math.floor((baseAmt * percent) / 100);
      if (!amountTokens || amountTokens <= 0) throw new Error('skip_zero_balance');
      return buildJupiterSellTx({
        wallet,
        inputMint: mint,
        outputMint: 'So11111111111111111111111111111111111111112',
        amountTokens,
        slippageBps: base.slippageBps,
        cluster: base.cluster,
        priorityFeeMicrolamports: base.priorityFeeMicrolamports,
      });
    },
  });
}

type PersistShape = {
  user: string;
  groupId: string;
  mint: string;
  conditions: SellCondition[];
  updatedAt: number;
};

async function persistConditions(input: {
  user: string;
  groupId: string;
  mint: string;
  conditions: SellCondition[];
}) {
  try {
    const dir = join(process.cwd(), 'data', input.user);
    await fsp.mkdir(dir, { recursive: true });
    const file = join(dir, 'sell-conditions.json');
    let existing: PersistShape[] = [];
    try {
      const raw = await fsp.readFile(file, 'utf8');
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    } catch {}
    const filtered = existing.filter(
      (e) => !(e.groupId === input.groupId && e.mint === input.mint),
    );
    filtered.push({
      user: input.user,
      groupId: input.groupId,
      mint: input.mint,
      conditions: input.conditions,
      updatedAt: Date.now(),
    });
    await fsp.writeFile(file, JSON.stringify(filtered, null, 2));
  } catch {}
}

export async function PUT(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json();
    const { groupId, mint, conditions } = body as {
      groupId: string;
      mint: string;
      conditions: SellCondition[];
    };
    if (!groupId || !mint || !Array.isArray(conditions))
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await persistConditions({ user, groupId, mint, conditions });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const mint = url.searchParams.get('mint');
    if (!groupId || !mint) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const dir = join(process.cwd(), 'data', user);
    const file = join(dir, 'sell-conditions.json');
    let items: PersistShape[] = [];
    try {
      const raw = await fsp.readFile(file, 'utf8');
      items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [];
    } catch {}
    const filtered = items.filter((e) => !(e.groupId === groupId && e.mint === mint));
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(file, JSON.stringify(filtered, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
