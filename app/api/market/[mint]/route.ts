import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireToken(headers: Headers): boolean {
  const expected = process.env.ENGINE_API_TOKEN;
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

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
    liquidityUsd: Number(pair.liquidity?.usd || 0),
    lastUpdated: new Date().toISOString(),
    pair: {
      name: pair?.baseToken?.name,
      symbol: pair?.baseToken?.symbol,
      dex: pair?.dexId,
      url: pair?.url,
    },
  };
}

export async function GET(request: Request, context: { params: { mint?: string } }) {
  const requestId = randomUUID();
  try {
    if (!requireToken(request.headers)) return apiError(401, 'unauthorized', requestId);
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(`market:${key}`, 30, 10)) return apiError(429, 'rate_limited', requestId);
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large', requestId);
    const mint = context.params?.mint;
    if (!mint || typeof mint !== 'string') return apiError(400, 'invalid_mint', requestId);
    const data = await fetchFromDexscreener(mint);
    if (!data) return apiError(404, 'not_found', requestId);
    return NextResponse.json({ ...data, requestId });
  } catch {
    return apiError(502, 'upstream_unavailable', requestId);
  }
}
