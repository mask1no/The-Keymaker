import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DsToken = {
  chainId?: string;
  address?: string;
  baseToken?: { symbol?: string; address?: string } | null;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url?: string }>;
    socials?: Array<{ type: string; url?: string }>;
  } | null;
};

const CACHE = new Map<string, { at: number; data: any }>();

function sanitizeUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function GET() {
  try {
    const key = 'trending';
    const now = Date.now();
    const cached = CACHE.get(key);
    if (cached && now - cached.at < 5000) {
      return NextResponse.json(cached.data, { headers: { 'Cache-Control': 'no-store' } });
    }

    const url = 'https://api.dexscreener.com/latest/dex/tokens/solana/trending';
    let res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 500));
      res = await fetch(url, { headers: { Accept: 'application/json' } });
    }
    if (!res.ok) return NextResponse.json({ error: 'upstream_failed' }, { status: 502 });
    const json = (await res.json()) as { tokens?: DsToken[] };
    const items = (json.tokens || [])
      .filter((t) => t.chainId === 'solana' && t.address)
      .slice(0, 50);
    const mapped = items
      .map((t) => {
        const ca = String(t.address);
        const symbol = String(t.baseToken?.symbol || '').slice(0, 16);
        const websites = t.info?.websites
          ?.map((w) => sanitizeUrl(w.url))
          .filter(Boolean) as string[];
        const socials = t.info?.socials || [];
        const twitter = sanitizeUrl(socials.find((s) => s.type === 'twitter')?.url);
        const telegram = sanitizeUrl(socials.find((s) => s.type === 'telegram')?.url);
        const image = sanitizeUrl(t.info?.imageUrl);
        return { ca, symbol, name: symbol, image, website: websites?.[0], twitter, telegram };
      })
      .filter((x) => x.ca && x.symbol);

    const data = { list: mapped };
    CACHE.set(key, { at: now, data });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store', ETag: String(now) } });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
