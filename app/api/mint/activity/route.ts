import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';

type Item = {
  ts: number;
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  wallet: string;
  sig?: string;
};
const cache: Record<string, { at: number; items: Item[] }> = {};

export const GET = withSessionAndLimit(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint') || 'unknown';
  const sinceTs = Number(searchParams.get('sinceTs') || '0');
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '50')));

  const key = `${mint}`;
  const now = Date.now();
  const entry = cache[key];
  if (!entry || now - entry.at > 5000) {
    // Replace with real provider; here we just synthesize placeholder items
    const base: Item[] = Array.from({ length: 60 }).map((_, i) => ({
      ts: now - i * 2000,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      price: 0.0001 + Math.random() * 0.0002,
      qty: Math.random() * 1000,
      wallet: 'DevWallet',
    }));
    cache[key] = { at: now, items: base };
  }
  const all = cache[key].items.filter((x) => (sinceTs ? x.ts >= sinceTs : true)).slice(0, limit);
  const stale = now - (cache[key]?.at || 0) > 8000;
  return { items: all, stale } as any;
});

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Item = {
  ts: number;
  side: 'buy' | 'sell';
  sol: number;
  tokens: number;
  wallet: string;
  sig: string;
};

const CACHE = new Map<string, { at: number; items: Item[] }>();
const CACHE_TTL_MS = 3000;

async function fetchDexScreener(mint: string): Promise<Item[] | null> {
  try {
    // DexScreener token endpoint (pairs summary); trades detailed endpoints vary. We'll approximate using recent txs if available.
    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    const pairs: any[] = Array.isArray(j?.pairs) ? j.pairs : [];
    // No transaction feed provided here; return empty to signal fallback
    return [];
  } catch {
    return null;
  }
}

async function fetchBirdeye(mint: string, limit = 50): Promise<Item[] | null> {
  try {
    const key = process.env.BIRDEYE_API_KEY;
    if (!key) return null;
    const url = `https://public-api.birdeye.so/defi/transactions?address=${encodeURIComponent(mint)}&offset=0&limit=${limit}`;
    const r = await fetch(url, {
      headers: { accept: 'application/json', 'X-API-KEY': key },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    const txs: any[] = Array.isArray(j?.data?.items) ? j.data.items : [];
    const items: Item[] = [];
    for (const t of txs) {
      const ts = Number(t?.blockUnixTime || t?.blockTime || 0) * 1000;
      const side: 'buy' | 'sell' = (t?.txType || '').toLowerCase().includes('sell')
        ? 'sell'
        : 'buy';
      const sol = Number(t?.value || t?.amountUSD || 0) / (Number(j?.data?.solPrice || 0) || 1);
      const tokens = Number(t?.tokenAmount || t?.amountToken || 0);
      const wallet = String(t?.owner || t?.trader || t?.signer || '').slice(0, 44);
      const sig = String(t?.signature || t?.txHash || t?.txId || '');
      if (Number.isFinite(ts) && sig)
        items.push({ ts, side, sol: Number(sol) || 0, tokens: Number(tokens) || 0, wallet, sig });
    }
    // Descending by time
    items.sort((a, b) => b.ts - a.ts);
    return items;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mint = url.searchParams.get('mint') || '';
    if (!mint) return NextResponse.json({ error: 'invalid_mint' }, { status: 400 });
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || '50')));
    const sinceTsParam = Number(url.searchParams.get('sinceTs') || 0);
    const sinceTs =
      Number.isFinite(sinceTsParam) && sinceTsParam > 0 ? sinceTsParam : Date.now() - 5 * 60 * 1000;

    const now = Date.now();
    const hit = CACHE.get(mint);
    if (hit && now - hit.at < CACHE_TTL_MS) {
      const items = hit.items.filter((i) => i.ts >= sinceTs).slice(0, limit);
      return NextResponse.json({ items });
    }

    const primary = (await fetchBirdeye(mint, limit)) || (await fetchDexScreener(mint));
    const items = (primary || []).filter((i) => i.ts >= sinceTs).slice(0, limit);
    CACHE.set(mint, { at: now, items });
    const stale = !primary;
    return NextResponse.json({ items, ...(stale ? { stale: true } : {}) });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
