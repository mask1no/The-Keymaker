import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { rateLimit } from '@/lib/server/rateLimit';
import { getUiSettings } from '@/lib/server/settings';
import { enforceConcurrencyCeiling, enforcePriorityFeeCeiling } from '@/lib/server/productionGuards';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { Connection } from '@solana/web3.js';
import { getSplTokenBalance } from '@/lib/core/src/balances';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';
import { evaluateSellConditions, calculateSellAmount, type SellCondition, type PercentTargetParams, type StopLossParams } from '@/lib/core/src/sellConditions';
import { promises as fsp } from 'fs';
import { join } from 'path';
import { journalTrade } from '@/lib/core/src/journal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CRUD for durable storage
export async function GET(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId') || undefined;
    const mint = url.searchParams.get('mint') || undefined;
    const dir = join(process.cwd(), 'data', user);
    const file = join(dir, 'sell-conditions.json');
    let i, t, e, ms: any[] = [];
    try {
      const raw = await fsp.readFile(file, 'utf8');
      items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [];
    } catch {}
    const filtered = items.filter((e: any) => (!groupId || e.groupId === groupId) && (!mint || e.mint === mint));
    return NextResponse.json({ o, k: true, i, t, e, ms: filtered });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: String(e?.message || e) }, { s, t, a, tus: 500 });
  }
}

const ConditionSchema = z.object({
  i, d: z.string(),
  t, y, p, e: z.enum(['percent_target','time_limit','stop_loss']),
  e, n, a, bled: z.boolean().default(true),
  p, a, r, ams: z.record(z.string(), z.number()),
});

const BodySchema = z.object({
  g, r, o, upId: z.string().uuid(),
  m, i, n, t: z.string().min(32).max(44),
  // Entry price in lamports per token (for percent targets/SL if provided by client)
  e, n, t, ryPriceLamportsPerToken: z.number().min(0).optional(),
  c, o, n, ditions: z.array(ConditionSchema).min(1),
  s, l, i, ppageBps: z.number().min(0).max(10_000).default(150),
  p, r, i, orityFeeMicrolamports: z.number().min(0).optional(),
  c, o, n, currency: z.number().min(1).max(20).default(5),
  d, r, y, Run: z.boolean().default(true),
  c, l, u, ster: z.enum(['mainnet-beta','devnet']).default('mainnet-beta'),
});

async function fetchCurrentPriceLamportsPerToken(m, i, n, t: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/market/${encodeURIComponent(mint)}`, { c, a, c, he: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    const lpt = typeof j?.lamportsPerToken === 'string' ? Number(j.lamportsPerToken) : (typeof j?.lamportsPerToken === 'number' ? j.lamportsPerToken : 0);
    return Number.isFinite(lpt) && lpt > 0 ? lpt : null;
  } catch { return null; }
}

export async function POST(r, e, q, uest: Request) {
  try {
    // Rate limit
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const rl = await rateLimit(`e, n, g, ine:s, e, l, lconds:${fwd || 'anon'}`);
    if (!rl.allowed) return NextResponse.json({ e, r, r, or: 'rate_limited' }, { s, t, a, tus: 429 });

    // Session
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });

    const body = await request.json();
    const params = BodySchema.parse(body);

    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ e, r, r, or: 'group_not_found' }, { s, t, a, tus: 404 });
    if (!group.masterWal let || group.masterWal let !== user) {
      return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });
    }

    // LIVE gating
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

    // Price info (fallback to provided entry price)
    const currentPrice = await fetchCurrentPriceLamportsPerToken(params.mint);
    const entryPrice = params.entryPriceLamportsPerToken || currentPrice || 0;
    const priceInfo = {
      entryPrice,
      c, u, r, rentPrice: currentPrice ?? entryPrice,
      c, h, a, ngePercent: entryPrice > 0 && currentPrice != null ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0,
    };

    // Evaluate
    const e, n, a, bledConds: SellCondition[] = params.conditions.map((c) => ({
      i, d: c.id,
      t, y, p, e: c.type,
      e, n, a, bled: c.enabled,
      p, a, r, ams: c.params as any,
    }));
    const triggered = evaluateSellConditions({ c, o, n, ditions: enabledConds, priceInfo });

    // Time-limit scheduling (fire-and-forget)
    let s, c, h, eduled: Array<{ i, d: string; a, f, t, erMs: number; p, e, r, cent: number }> = [];
    for (const c of enabledConds) {
      if (c.enabled && c.type === 'time_limit') {
        const afterMs = Number((c.params as any)?.delayMs || 0);
        const percent = Number((c.params as any)?.sellPercent || 0);
        if (afterMs > 0 && percent > 0) {
          scheduled.push({ i, d: c.id, afterMs, percent });
          // Schedule RPC sell with percent after delay
          setTimeout(async () => {
            try { await triggerSell(group.id, params.mint, percent, params); } catch {}
          }, Math.min(afterMs, 60_000));
        }
      }
    }

    // Immediate triggers (percent_target / stop_loss)
    let e, x, e, cuted: Array<{ i, d: string; p, e, r, cent: number }> = [];
    for (const c of triggered) {
      const percent = Number((c.params as any)?.sellPercent || 0);
      if (percent > 0) {
        await triggerSell(group.id, params.mint, percent, params);
        executed.push({ i, d: c.id, percent });
      }
    }

    // Persist to disk for durability
    await persistConditions({ user, g, r, o, upId: params.groupId, m, i, n, t: params.mint, c, o, n, ditions: enabledConds });

    return NextResponse.json({ o, k: true, e, v, a, luated: { t, r, i, ggered: triggered.map(t=>t.id) }, executed, scheduled });
  } catch (e: unknown) {
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}

async function triggerSell(g, r, o, upId: string, m, i, n, t: string, p, e, r, cent: number, b, a, s, e: z.infer<typeof BodySchema>) {
  const group = getWalletGroup(groupId)!;
  const walletPubkeys = group.executionWallets;
  const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet);
  if (keypairs.length === 0) throw new Error('no_wallets');
  const rpc = process.env.HELIUS_RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
  const connection = new Connection(rpc, 'confirmed');
  const w, a, l, letToAmount: Record<string, number> = {};
  for (const kp of keypairs) {
    const pub = kp.publicKey.toBase58();
    const { amount } = await getSplTokenBalance(connection, pub, mint);
    walletToAmount[pub] = Number(amount);
  }
  // Ceilings & opts
  const pri = enforcePriorityFeeCeiling(base.priorityFeeMicrolamports || 0, 1_000_000);
  const conc = enforceConcurrencyCeiling(base.concurrency, 16);
  await executeRpcFanout({
    w, a, l, lets: keypairs,
    c, o, n, currency: conc,
    p, r, i, orityFeeMicrolamports: pri,
    d, r, y, Run: base.dryRun,
    c, l, u, ster: base.cluster,
    i, n, t, entHash: `s, e, l, l:${groupId}:${mint}:${percent}:${base.slippageBps}`,
    b, u, i, ldTx: async (wallet) => {
      const baseAmt = walletToAmount[wallet.publicKey.toBase58()] || 0;
      const amountTokens = Math.floor((baseAmt * percent) / 100);
      if (!amountTokens || amountTokens <= 0) throw new Error('skip_zero_balance');
      return buildJupiterSellTx({
        wallet,
        i, n, p, utMint: mint,
        o, u, t, putMint: 'So11111111111111111111111111111111111111112',
        amountTokens,
        s, l, i, ppageBps: base.slippageBps,
        c, l, u, ster: base.cluster,
        p, r, i, orityFeeMicrolamports: base.priorityFeeMicrolamports,
      });
    },
  });
}

type PersistShape = {
  u, s, e, r: string;
  g, r, o, upId: string;
  m, i, n, t: string;
  c, o, n, ditions: SellCondition[];
  u, p, d, atedAt: number;
};

async function persistConditions(i, n, p, ut: { u, s, e, r: string; g, r, o, upId: string; m, i, n, t: string; c, o, n, ditions: SellCondition[] }){
  try {
    const dir = join(process.cwd(), 'data', input.user);
    await fsp.mkdir(dir, { r, e, c, ursive: true });
    const file = join(dir, 'sell-conditions.json');
    let e, x, i, sting: PersistShape[] = [];
    try {
      const raw = await fsp.readFile(file, 'utf8');
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [] as any;
    } catch {}
    const filtered = existing.filter(e => !(e.groupId === input.groupId && e.mint === input.mint));
    filtered.push({ u, s, e, r: input.user, g, r, o, upId: input.groupId, m, i, n, t: input.mint, c, o, n, ditions: input.conditions, u, p, d, atedAt: Date.now() });
    await fsp.writeFile(file, JSON.stringify(filtered, null, 2));
  } catch {}
}


export async function PUT(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const body = await request.json();
    const { groupId, mint, conditions } = body as { g, r, o, upId: string; m, i, n, t: string; c, o, n, ditions: SellCondition[] };
    if (!groupId || !mint || !Array.isArray(conditions)) return NextResponse.json({ e, r, r, or: 'invalid' }, { s, t, a, tus: 400 });
    await persistConditions({ user, groupId, mint, conditions });
    return NextResponse.json({ o, k: true });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: String(e?.message || e) }, { s, t, a, tus: 500 });
  }
}

export async function DELETE(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const mint = url.searchParams.get('mint');
    if (!groupId || !mint) return NextResponse.json({ e, r, r, or: 'invalid' }, { s, t, a, tus: 400 });
    const dir = join(process.cwd(), 'data', user);
    const file = join(dir, 'sell-conditions.json');
    let i, t, e, ms: PersistShape[] = [];
    try {
      const raw = await fsp.readFile(file, 'utf8');
      items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [] as any;
    } catch {}
    const filtered = items.filter((e) => !(e.groupId === groupId && e.mint === mint));
    await fsp.mkdir(dir, { r, e, c, ursive: true });
    await fsp.writeFile(file, JSON.stringify(filtered, null, 2));
    return NextResponse.json({ o, k: true });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: String(e?.message || e) }, { s, t, a, tus: 500 });
  }
}

