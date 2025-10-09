import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function birdeyeByCA(ca: string) {
  const key = process.env.BIRDEYE_API_KEY || '';
  if (!key) return null;
  const r = await fetch(
    `https://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(ca)}`,
    {
      headers: { 'X-API-KEY': key, accept: 'application/json' },
      cache: 'no-store',
    },
  );
  if (!r.ok) return null;
  const j = await r.json().catch(() => null) as { data?: { name?: string; symbol?: string; logoURI?: string; websites?: string[] } } | null;
  if (!j?.data) return null;
  const d = j.data;
  return {
    ca,
    name: d.name || '',
    symbol: d.symbol || '',
    image: d.logoURI || '',
    website: d.websites?.[0] || '',
    twitter: d.twitter || '',
    telegram: d.telegram || '',
  };
}

async function dexByCA(ca: string) {
  const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`, {
    cache: 'no-store',
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null) as { pairs?: Array<{ info?: { imageUrl?: string; websites?: Array<{ url?: string }>; socials?: Array<{ type: string; url?: string }> } }> } | null;
  const p = j?.pairs?.[0];
  if (!p) return null;
  return {
    ca,
    name: p.baseToken?.name || '',
    symbol: p.baseToken?.symbol || '',
    image: p.info?.imageUrl || '',
    website: p.info?.websites?.[0]?.url || '',
    twitter: p.info?.socials?.find((s: { type: string; url?: string }) => s.type === 'twitter')?.url || '',
    telegram: p.info?.socials?.find((s: { type: string; url?: string }) => s.type === 'telegram')?.url || '',
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ca = searchParams.get('ca') || '';
  if (!ca) return NextResponse.json({ ok: false, error: 'missing ca' }, { status: 400 });
  // Back-compat: proxy to richer token meta API
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/token/${encodeURIComponent(ca)}/meta`,
      { cache: 'no-store' },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.draft)
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    const d = j.draft as { name?: string; symbol?: string; image?: string; website?: string; twitter?: string; telegram?: string };
    const coin = {
      ca,
      name: d.name,
      symbol: d.symbol,
      image: d.image,
      website: d.website,
      twitter: d.twitter,
      telegram: d.telegram,
    };
    return new NextResponse(JSON.stringify({ ok: true, coin }), {
      status: 200,
      headers: { 'X-Deprecated': 'Use /api/token/[mint]/meta' },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
