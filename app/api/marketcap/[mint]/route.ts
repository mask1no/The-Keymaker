import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchFromDexscreener(mint: string) {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
  const res = await fetch(url, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error('dexscreener_failed');
  const j = await res.json();
  const pair = j?.pairs?.[0];
  if (!pair) return null;
  return {
    mint,
    price: Number(pair.priceUsd || 0),
    priceChange24h: Number(pair.priceChange?.h24 || 0),
    volume24h: Number(pair.volume?.h24 || 0),
    marketCap: Number(pair.fdv || pair.liquidity?.usd || 0),
    lastUpdated: new Date().toISOString(),
    pair: { name: pair?.baseToken?.name, symbol: pair?.baseToken?.symbol },
  };
}

export async function GET(_request: Request, context: { params: { mint?: string } }) {
  try {
    const mint = context.params?.mint;
    if (!mint || typeof mint !== 'string') {
      return NextResponse.json({ error: 'invalid_mint' }, { status: 400 });
    }
    const data = await fetchFromDexscreener(mint);
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
