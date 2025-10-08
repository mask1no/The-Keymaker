import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type Row = {
  symbol: 'BTC' | 'ETH' | 'SOL' | 'CAKE';
  price: number;
  change24h: number;
  logoUrl?: string;
  stale?: boolean;
};

const CACHE: { at: number; data: Row[] } = { at: 0, data: [] };
const TTL = 5000;

async function fetchCoinGeckoPrice(
  coinId: string,
): Promise<{ price: number; change24h: number } | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const coin = data[coinId];
    if (!coin) return null;
    return {
      price: coin.usd || 0,
      change24h: coin.usd_24h_change || 0,
    };
  } catch {
    return null;
  }
}

async function fetchBirdeyeSolPrice(): Promise<{ price: number; change24h: number } | null> {
  try {
    const apiKey = process.env.BIRDEYE_API_KEY;
    const headers: Record<string, string> = apiKey ? { 'X-API-KEY': apiKey } : {};
    const url =
      'https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112';
    const res = await fetch(url, {
      cache: 'no-store',
      headers:
        Object.keys(headers).length > 0
          ? { accept: 'application/json', ...headers }
          : { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.data?.value || data?.data?.price || 0);
    if (!Number.isFinite(price) || price <= 0) return null;
    return { price, change24h: 0 };
  } catch {
    return null;
  }
}

async function fetchRow(symbol: Row['symbol']): Promise<Row> {
  let result: { price: number; change24h: number } | null = null;

  switch (symbol) {
    case 'BTC':
      result = await fetchCoinGeckoPrice('bitcoin');
      break;
    case 'ETH':
      result = await fetchCoinGeckoPrice('ethereum');
      break;
    case 'SOL':
      result = (await fetchBirdeyeSolPrice()) || (await fetchCoinGeckoPrice('solana'));
      break;
    case 'CAKE':
      result = await fetchCoinGeckoPrice('pancakeswap-token');
      break;
  }

  if (!result) {
    return { symbol, price: 0, change24h: 0, stale: true };
  }

  return { symbol, price: result.price, change24h: result.change24h };
}

export async function GET(_req: NextRequest) {
  const now = Date.now();

  if (now - CACHE.at > TTL) {
    try {
      const results = await Promise.all(
        (['BTC', 'ETH', 'SOL', 'CAKE'] as const).map((s) => fetchRow(s)),
      );
      CACHE.data = results;
      CACHE.at = now;
    } catch {
      /* serve stale */
    }
  }

  const stale = now - CACHE.at > TTL * 2;
  return new Response(
    JSON.stringify({
      data: CACHE.data.map((r) => ({ ...r, stale: stale || r.stale })),
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=5' },
    },
  );
}
