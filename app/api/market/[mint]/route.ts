import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function dexscreener(mint: string) {
  try {
    const u = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
    const r = await fetch(u, { cache: 'no-store', headers: { 'accept': 'application/json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const pair = Array.isArray(j?.pairs) && j.pairs.length ? j.pairs[0] : null;
    if (!pair) return null;
    return {
      symbol: pair.baseToken?.symbol || '',
      name: pair.baseToken?.name || '',
      priceUsd: Number(pair.priceUsd || 0),
      fdvUsd: Number(pair.fdv || 0),
      liquidityUsd: Number(pair.liquidity?.usd || 0),
      pairUrl: pair.url || '',
      chain: pair.chainId || 'solana',
      dex: pair.dexId || 'raydium',
      volume24h: Number(pair.volume?.h24 || 0),
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: { params: { mint?: string } }) {
  try {
    const mint = context.params?.mint;
    if (!mint || typeof mint !== 'string') {
      return NextResponse.json({ error: 'invalid_mint' }, { status: 400 });
    }
    const ds = await dexscreener(mint);
    if (!ds) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true, mint, ...ds }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

