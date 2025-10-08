import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

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
const CACHE_TTL_MS = 5000;

async function fetchTrades(_mint: string, _limit = 50): Promise<Item[]> {
  // TODO: Birdeye/DexScreener
  return [];
}

export const GET = withSessionAndLimit(async (req: NextRequest) => {
  const url = new URL(req.url);
  const mint = url.searchParams.get('mint') || '';
  if (!mint) return { items: [] };
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || '50')));
  const sinceTsParam = Number(url.searchParams.get('sinceTs') || 0);
  const sinceTs =
    Number.isFinite(sinceTsParam) && sinceTsParam > 0 ? sinceTsParam : Date.now() - 5 * 60 * 1000;

  const now = Date.now();
  const hit = CACHE.get(mint);
  let items = hit?.items || [];
  let stale = false;
  if (!hit || now - hit.at > CACHE_TTL_MS) {
    try {
      items = await fetchTrades(mint, limit);
      CACHE.set(mint, { at: now, items });
    } catch {
      stale = true;
    }
  }
  const filtered = (items || []).filter((i) => i.ts >= sinceTs).slice(0, limit);
  return { items: filtered, ...(stale ? { stale: true } : {}) } as any;
});
