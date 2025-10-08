// Removed duplicate placeholder handler; keep single GET below

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TSymbol = 'BTC' | 'ETH' | 'SOL' | 'CAKE';
type TItem = {
  symbol: TSymbol;
  price: number;
  change24h: number;
  logoUrl: string;
  stale?: boolean;
  staleMs?: number;
};

const CACHE: { at: number; data: TItem[] } = { at: 0, data: [] };
const MAX_AGE_MS = 5000;

async function fetchSOL(): Promise<TItem | null> {
  // Prefer Birdeye; fallback to Helius price (if available in env or not)
  try {
    const beKey = process.env.BIRDEYE_API_KEY;
    const url =
      'https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112';
    const r = await fetch(url, {
      headers: { accept: 'application/json', ...(beKey ? { 'X-API-KEY': beKey } : {}) },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error('be_sol_fail');
    const j = (await r.json()) as any;
    const price = Number(j?.data?.value ?? j?.data?.price ?? 0);
    const change24h = Number(j?.data?.priceChange24hPercent ?? j?.data?.change24h ?? 0);
    if (!Number.isFinite(price) || price <= 0) throw new Error('be_sol_bad');
    return {
      symbol: 'SOL',
      price,
      change24h: change24h || 0,
      logoUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    };
  } catch {
    // Fallback: return null to let CoinGecko handle if desired later
    return null;
  }
}

async function fetchCG(
  ids: string[],
): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('cg_fail');
  return (await r.json()) as any;
}

const CG_ID: Record<TSymbol, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  CAKE: 'pancakeswap-token',
};

const LOGO: Record<TSymbol, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
};

export async function GET() {
  try {
    const now = Date.now();
    const age = now - CACHE.at;
    if (age < MAX_AGE_MS && CACHE.data.length) {
      const stale = age > 10_000;
      return NextResponse.json({
        data: CACHE.data.map((d) => ({ ...d, stale, staleMs: stale ? age : undefined })),
      });
    }

    const [sol, cg] = await Promise.all([
      fetchSOL(),
      fetchCG(['bitcoin', 'ethereum', 'solana', 'pancakeswap-token']).catch(() => ({}) as any),
    ]);

    const items: TItem[] = [];
    const want: TSymbol[] = ['BTC', 'ETH', 'SOL', 'CAKE'];
    for (const sym of want) {
      if (sym === 'SOL' && sol) {
        items.push(sol);
        continue;
      }
      const id = CG_ID[sym];
      const row = (cg as any)?.[id];
      if (row && Number.isFinite(row.usd)) {
        items.push({
          symbol: sym,
          price: Number(row.usd),
          change24h: Number(row.usd_24h_change || 0),
          logoUrl: LOGO[sym],
        });
      } else {
        items.push({ symbol: sym, price: 0, change24h: 0, logoUrl: LOGO[sym] });
      }
    }

    CACHE.at = now;
    CACHE.data = items;
    return NextResponse.json({ data: items });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
