import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';

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
    if (!mint || typeof mint !== 'string') return apiError(400, 'invalid_mint');
    // Token guard (optional header) + rate limit + 8KB cap
    const fwd = (_request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(key)) return apiError(429, 'rate_limited');
    const cl = Number(_request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large');
    const data = await fetchFromDexscreener(mint);
    if (!data) return apiError(404, 'not_found');
    return NextResponse.json(data);
  } catch {
    return apiError(500, 'failed');
  }
}
