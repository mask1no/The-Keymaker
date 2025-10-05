import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Quote = { lamportsPerToken: bigint; source: 'birdeye'|'dexscreener'; };

const cache = new Map<string, { at: number; q: Quote }>();
const TTL_MS = 5000; // 5s max cache

async function birdeye(mint: string): Promise<Quote | null> {
  try {
    const apiKey = process.env.BIRDEYE_API_KEY;
    // Try Birdeye price endpoint
    const url = `https://public-api.birdeye.so/defi/price?address=${encodeURIComponent(mint)}`;
    const r = await fetch(url, { cache: 'no-store', headers: { 'accept': 'application/json', ...(apiKey ? { 'X-API-KEY': apiKey } : {}) } });
    if (!r.ok) return null;
    const j = await r.json();
    const priceUsd = Number(j?.data?.value || j?.data?.price || 0);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    // Need SOL/USD to convert → lamports; try Birdeye SOL price
    const rSol = await fetch('https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112', {
      cache: 'no-store', headers: { 'accept': 'application/json', ...(apiKey ? { 'X-API-KEY': apiKey } : {}) }
    });
    if (!rSol.ok) return null;
    const jSol = await rSol.json();
    const solUsd = Number(jSol?.data?.value || jSol?.data?.price || 0);
    if (!Number.isFinite(solUsd) || solUsd <= 0) return null;
    const lamportsPerToken = BigInt(Math.floor((priceUsd / solUsd) * 1e9));
    if (lamportsPerToken <= 0n) return null;
    return { lamportsPerToken, source: 'birdeye' };
  } catch { return null; }
}

async function dexscreener(mint: string): Promise<Quote | null> {
  try {
    const u = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
    const r = await fetch(u, { cache: 'no-store', headers: { 'accept': 'application/json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const pair = Array.isArray(j?.pairs) && j.pairs.length ? j.pairs[0] : null;
    if (!pair) return null;
    const priceNative = Number(pair?.priceNative || 0);
    // priceNative is often SOL; convert SOL→lamports
    if (!Number.isFinite(priceNative) || priceNative <= 0) return null;
    const lamportsPerToken = BigInt(Math.floor(priceNative * 1e9));
    return { lamportsPerToken, source: 'dexscreener' };
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
    const now = Date.now();
    const hit = cache.get(mint);
    if (hit && now - hit.at < TTL_MS) {
      return NextResponse.json({ ok: true, mint, lamportsPerToken: hit.q.lamportsPerToken.toString(), source: hit.q.source }, { status: 200 });
    }
    const primary = await birdeye(mint);
    const fallback = primary || (await dexscreener(mint));
    if (!fallback) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    cache.set(mint, { at: now, q: fallback });
    return NextResponse.json({ ok: true, mint, lamportsPerToken: fallback.lamportsPerToken.toString(), source: fallback.source }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

