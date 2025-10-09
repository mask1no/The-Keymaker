import { NextResponse } from 'next/server';
import 'server-only';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';

interface TickerData {
  symbol: 'BTC' | 'ETH' | 'SOL' | 'CAKE';
  price: number;
  change24h: number;
  logoUrl?: string;
  stale?: boolean;
}

interface CacheEntry {
  data: TickerData[];
  fetchedAt: number;
}

const cache: CacheEntry | null = null;
let cachedData: CacheEntry | null = null;
const CACHE_TTL_MS = 5000;

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  CAKE: 'pancakeswap-token',
};

async function fetchCoinGeckoPrice(id: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { next: { revalidate: 5 } });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const info = data[id];

    if (!info) {
      return null;
    }

    return {
      price: Number(info.usd || 0),
      change24h: Number(info.usd_24h_change || 0),
    };
  } catch (error) {
    console.error(`CoinGecko fetch error for ${id}:`, error);
    return null;
  }
}

async function fetchBirdeyeSOLPrice(): Promise<{ price: number; change24h: number } | null> {
  try {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey) {
      return null;
    }

    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const url = `https://public-api.birdeye.so/defi/price?address=${SOL_MINT}`;

    const res = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
      },
      next: { revalidate: 5 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    return {
      price: Number(data?.data?.value || 0),
      change24h: Number(data?.data?.priceChange24h || 0),
    };
  } catch (error) {
    console.error('Birdeye SOL fetch error:', error);
    return null;
  }
}

async function fetchAllTickers(): Promise<TickerData[]> {
  const tickers: TickerData[] = [];
  let stale = false;

  try {
    const btcData = await fetchCoinGeckoPrice(COINGECKO_IDS.BTC);
    if (btcData) {
      tickers.push({
        symbol: 'BTC',
        price: btcData.price,
        change24h: btcData.change24h,
        logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      });
    }
  } catch (error) {
    console.error('BTC fetch failed:', error);
    stale = true;
  }

  try {
    const ethData = await fetchCoinGeckoPrice(COINGECKO_IDS.ETH);
    if (ethData) {
      tickers.push({
        symbol: 'ETH',
        price: ethData.price,
        change24h: ethData.change24h,
        logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      });
    }
  } catch (error) {
    console.error('ETH fetch failed:', error);
    stale = true;
  }

  try {
    let solData = await fetchBirdeyeSOLPrice();
    if (!solData) {
      solData = await fetchCoinGeckoPrice(COINGECKO_IDS.SOL);
    }
    if (solData) {
      tickers.push({
        symbol: 'SOL',
        price: solData.price,
        change24h: solData.change24h,
        logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      });
    }
  } catch (error) {
    console.error('SOL fetch failed:', error);
    stale = true;
  }

  try {
    const cakeData = await fetchCoinGeckoPrice(COINGECKO_IDS.CAKE);
    if (cakeData) {
      tickers.push({
        symbol: 'CAKE',
        price: cakeData.price,
        change24h: cakeData.change24h,
        logoUrl: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
      });
    }
  } catch (error) {
    console.error('CAKE fetch failed:', error);
    stale = true;
  }

  if (stale) {
    tickers.forEach((t) => {
      t.stale = true;
    });
  }

  return tickers;
}

export const GET = withSessionAndLimit(async (request) => {
  try {
    const now = Date.now();

    if (cachedData && now - cachedData.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json(
        { data: cachedData.data },
        {
          headers: {
            'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
          },
        }
      );
    }

    const tickers = await fetchAllTickers();

    cachedData = {
      data: tickers,
      fetchedAt: now,
    };

    return NextResponse.json(
      { data: tickers },
      {
        headers: {
          'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch market tickers:', error);

    if (cachedData) {
      return NextResponse.json(
        { data: cachedData.data.map((t) => ({ ...t, stale: true })) },
        {
          headers: {
            'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
          },
        }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch market tickers' }, { status: 500 });
  }
});

