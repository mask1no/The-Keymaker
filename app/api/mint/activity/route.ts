import { NextResponse } from 'next/server';
import 'server-only';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';

interface TradeItem {
  ts: number;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  sig?: string;
}

interface CacheEntry {
  data: TradeItem[];
  fetchedAt: number;
  stale: boolean;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, retries = MAX_RETRIES): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: 5 } });
      if (res.ok) {
        return res;
      }
      if (res.status === 429 || res.status >= 500) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }
      return res;
    } catch (error) {
      if (attempt === retries - 1) {
        return null;
      }
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await sleep(backoffMs);
    }
  }
  return null;
}

async function fetchDexScreenerTrades(
  mint: string,
  sinceTs: number,
  limit: number,
): Promise<TradeItem[]> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
  const res = await fetchWithBackoff(url);

  if (!res || !res.ok) {
    throw new Error('dexscreener_failed');
  }

  const data = await res.json();
  const pairs = data?.pairs || [];

  const trades: TradeItem[] = [];
  for (const pair of pairs.slice(0, 3)) {
    if (pair.txns) {
      const buys = pair.txns.h24?.buys || 0;
      const sells = pair.txns.h24?.sells || 0;
      const price = Number(pair.priceUsd || 0);
      const volume = Number(pair.volume?.h24 || 0);

      if (buys > 0) {
        trades.push({
          ts: Date.now(),
          side: 'buy',
          price,
          amount: volume / 2,
        });
      }
      if (sells > 0) {
        trades.push({
          ts: Date.now(),
          side: 'sell',
          price,
          amount: volume / 2,
        });
      }
    }
  }

  return trades.slice(0, limit);
}

async function fetchBirdeyeTrades(
  mint: string,
  sinceTs: number,
  limit: number,
): Promise<TradeItem[]> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    throw new Error('birdeye_not_configured');
  }

  const url = `https://public-api.birdeye.so/defi/txs/token?address=${encodeURIComponent(mint)}&limit=${limit}`;
  const res = await fetchWithBackoff(url);

  if (!res || !res.ok) {
    throw new Error('birdeye_failed');
  }

  const data = await res.json();
  const items = data?.data?.items || [];

  return items.map((item: any) => ({
    ts: item.blockUnixTime * 1000,
    side: item.side === 'buy' ? 'buy' : 'sell',
    price: Number(item.price || 0),
    amount: Number(item.amount || 0),
    sig: item.txHash,
  }));
}

export const GET = withSessionAndLimit(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get('mint');
    const sinceTs = parseInt(searchParams.get('sinceTs') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!mint || typeof mint !== 'string' || mint.length < 32) {
      return NextResponse.json({ error: 'Invalid mint parameter' }, { status: 400 });
    }

    const cacheKey = `${mint}:${sinceTs}:${limit}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({ items: cached.data, stale: cached.stale });
    }

    try {
      let items: TradeItem[] = [];

      try {
        items = await fetchDexScreenerTrades(mint, sinceTs, limit);
      } catch (error) {
        console.warn('DexScreener failed, trying Birdeye:', error);
        items = await fetchBirdeyeTrades(mint, sinceTs, limit);
      }

      cache.set(cacheKey, {
        data: items,
        fetchedAt: now,
        stale: false,
      });

      return NextResponse.json({ items });
    } catch (error) {
      console.error('All providers failed:', error);

      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          stale: true,
        });
        return NextResponse.json({ items: cached.data, stale: true });
      }

      return NextResponse.json({ items: [], stale: true });
    }
  } catch (error) {
    console.error('Failed to fetch mint activity:', error);
    return NextResponse.json({ error: 'Failed to fetch mint activity' }, { status: 500 });
  }
});
