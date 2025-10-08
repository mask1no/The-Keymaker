import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';

const cache = new Map<string, { ts: number; items: any[] }>();
const TTL = 5000;
const backoffMap = new Map<string, { nextAttemptTs: number; delayMs: number }>();

async function fetchWithBackoff(url: string, headers?: Record<string, string>): Promise<any> {
  const backoff = backoffMap.get(url);
  const now = Date.now();

  if (backoff && now < backoff.nextAttemptTs) {
    throw new Error('rate_limited');
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { accept: 'application/json', ...headers },
    });

    if (res.status === 429 || res.status >= 500) {
      const currentDelay = backoff?.delayMs || 1000;
      const nextDelay = Math.min(currentDelay * 2, 30000);
      backoffMap.set(url, {
        nextAttemptTs: now + nextDelay,
        delayMs: nextDelay,
      });
      throw new Error('rate_limited');
    }

    if (!res.ok) {
      throw new Error('fetch_failed');
    }

    backoffMap.delete(url);
    return await res.json();
  } catch (e) {
    if ((e as Error).message === 'rate_limited') throw e;
    throw new Error('fetch_failed');
  }
}

async function fetchDexScreenerActivity(mint: string): Promise<any[]> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
    const data = await fetchWithBackoff(url);
    const pair = Array.isArray(data?.pairs) && data.pairs.length ? data.pairs[0] : null;
    if (!pair) return [];

    return [
      {
        ts: Date.now(),
        source: 'dexscreener',
        price: pair.priceNative || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchBirdeyeActivity(mint: string): Promise<any[]> {
  try {
    const apiKey = process.env.BIRDEYE_API_KEY;
    const headers: Record<string, string> = apiKey ? { 'X-API-KEY': apiKey } : {};
    const url = `https://public-api.birdeye.so/defi/price?address=${encodeURIComponent(mint)}`;
    const data = await fetchWithBackoff(url, Object.keys(headers).length > 0 ? headers : undefined);

    const price = Number(data?.data?.value || data?.data?.price || 0);
    if (!Number.isFinite(price) || price <= 0) return [];

    return [
      {
        ts: Date.now(),
        source: 'birdeye',
        priceUsd: price,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchTrades(mint: string): Promise<any[]> {
  const [dex, bird] = await Promise.all([
    fetchDexScreenerActivity(mint),
    fetchBirdeyeActivity(mint),
  ]);

  return [...dex, ...bird];
}

export const GET = withSessionAndLimit(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint') || '';
  const sinceTs = Number(searchParams.get('sinceTs') || 0);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));

  if (!mint) return { items: [] };

  const ent = cache.get(mint);
  const now = Date.now();
  let items = ent?.items ?? [];
  let stale = false;

  if (!ent || now - ent.ts > TTL) {
    try {
      items = await fetchTrades(mint);
      cache.set(mint, { ts: now, items });
    } catch {
      stale = true;
    }
  } else if (now - ent.ts > TTL * 2) {
    stale = true;
  }

  const filtered = items.filter((x: any) => !sinceTs || x.ts > sinceTs).slice(0, limit);
  return { items: filtered, stale };
});
