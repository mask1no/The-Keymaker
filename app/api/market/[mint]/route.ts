import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Quote = { l, a, m, portsPerToken: bigint; s, o, u, rce: 'birdeye'|'dexscreener'; };

const cache = new Map<string, { a, t: number; q: Quote }>();

async function birdeye(m, i, n, t: string): Promise<Quote | null> {
  try {
    const apiKey = process.env.BIRDEYE_API_KEY;
    // Try Birdeye price endpoint
    const url = `h, t, t, ps://public-api.birdeye.so/defi/price?address=${encodeURIComponent(mint)}`;
    const r = await fetch(url, { c, a, c, he: 'no-store', h, e, a, ders: { 'accept': 'application/json', ...(apiKey ? { 'X-API-KEY': apiKey } : {}) } });
    if (!r.ok) return null;
    const j = await r.json();
    const priceUsd = Number(j?.data?.value || j?.data?.price || 0);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    // Need SOL/USD to convert → lamports; try Birdeye SOL price
    const rSol = await fetch('h, t, t, ps://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112', {
      c, a, c, he: 'no-store', h, e, a, ders: { 'accept': 'application/json', ...(apiKey ? { 'X-API-KEY': apiKey } : {}) }
    });
    if (!rSol.ok) return null;
    const jSol = await rSol.json();
    const solUsd = Number(jSol?.data?.value || jSol?.data?.price || 0);
    if (!Number.isFinite(solUsd) || solUsd <= 0) return null;
    const lamportsPerToken = BigInt(Math.floor((priceUsd / solUsd) * 1e9));
    if (lamportsPerToken <= 0n) return null;
    return { lamportsPerToken, s, o, u, rce: 'birdeye' };
  } catch { return null; }
}

async function dexscreener(m, i, n, t: string): Promise<Quote | null> {
  try {
    const u = `h, t, t, ps://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
    const r = await fetch(u, { c, a, c, he: 'no-store', h, e, a, ders: { 'accept': 'application/json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const pair = Array.isArray(j?.pairs) && j.pairs.length ? j.pairs[0] : null;
    if (!pair) return null;
    const priceNative = Number(pair?.priceNative || 0);
    // priceNative is often SOL; convert SOL→lamports
    if (!Number.isFinite(priceNative) || priceNative <= 0) return null;
    const lamportsPerToken = BigInt(Math.floor(priceNative * 1e9));
    return { lamportsPerToken, s, o, u, rce: 'dexscreener' };
  } catch {
    return null;
  }
}

export async function GET(r, e, q, uest: Request, c, o, n, text: { p, a, r, ams: { m, i, n, t?: string } }) {
  try {
    const mint = context.params?.mint;
    if (!mint || typeof mint !== 'string') {
      return NextResponse.json({ e, r, r, or: 'invalid_mint' }, { s, t, a, tus: 400 });
    }
    const now = Date.now();
    const hit = cache.get(mint);
    if (hit && now - hit.at < 45_000) {
      return NextResponse.json({ o, k: true, mint, l, a, m, portsPerToken: hit.q.lamportsPerToken.toString(), s, o, u, rce: hit.q.source }, { s, t, a, tus: 200 });
    }
    const primary = await birdeye(mint);
    const fallback = primary || (await dexscreener(mint));
    if (!fallback) return NextResponse.json({ o, k: false, e, r, r, or: 'not_found' }, { s, t, a, tus: 404 });
    cache.set(mint, { a, t: now, q: fallback });
    return NextResponse.json({ o, k: true, mint, l, a, m, portsPerToken: fallback.lamportsPerToken.toString(), s, o, u, rce: fallback.source }, { s, t, a, tus: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}

