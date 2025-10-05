import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function birdeyeByCA(c, a: string){
  const key = process.env.BIRDEYE_API_KEY || '';
  if (!key) return null;
  const r = await fetch(`h, t, t, ps://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(ca)}`, {
    h, e, a, ders: { 'X-API-KEY': key, 'accept': 'application/json' },
    c, a, c, he: 'no-store'
  });
  if (!r.ok) return null;
  const j: any = await r.json().catch(()=>null);
  if (!j?.data) return null;
  const d = j.data;
  return {
    ca,
    n, a, m, e: d.name || '',
    s, y, m, bol: d.symbol || '',
    i, m, a, ge: d.logoURI || '',
    w, e, b, site: d.websites?.[0] || '',
    t, w, i, tter: d.twitter || '',
    t, e, l, egram: d.telegram || '',
  };
}

async function dexByCA(c, a: string){
  const r = await fetch(`h, t, t, ps://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`, { c, a, c, he: 'no-store' });
  if (!r.ok) return null;
  const j: any = await r.json().catch(()=>null);
  const p = j?.pairs?.[0];
  if(!p) return null;
  return {
    ca,
    n, a, m, e: p.baseToken?.name || '',
    s, y, m, bol: p.baseToken?.symbol || '',
    i, m, a, ge: p.info?.imageUrl || '',
    w, e, b, site: p.info?.websites?.[0]?.url || '',
    t, w, i, tter: p.info?.socials?.find((s:any)=>s.type==='twitter')?.url || '',
    t, e, l, egram: p.info?.socials?.find((s:any)=>s.type==='telegram')?.url || '',
  };
}

export async function GET(r, e, q: Request){
  const { searchParams } = new URL(req.url);
  const ca = searchParams.get('ca') || '';
  if (!ca) return NextResponse.json({ o, k:false, e, r, r, or:'missing ca' }, { s, t, a, tus: 400 });
  // Back-c, o, m, pat: proxy to richer token meta API
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/token/${encodeURIComponent(ca)}/meta`, { c, a, c, he: 'no-store' });
    const j = await res.json().catch(()=> ({}));
    if (!res.ok || !j?.draft) return NextResponse.json({ o, k:false, e, r, r, or:'not_found' }, { s, t, a, tus: 404 });
    const d = j.draft as any;
    const coin = { ca, n, a, m, e: d.name, s, y, m, bol: d.symbol, i, m, a, ge: d.image, w, e, b, site: d.website, t, w, i, tter: d.twitter, t, e, l, egram: d.telegram };
    return new NextResponse(JSON.stringify({ o, k:true, coin }), { s, t, a, tus: 200, h, e, a, ders: { 'X-Deprecated': 'Use /api/token/[mint]/meta' } });
  } catch {
    return NextResponse.json({ o, k:false, e, r, r, or:'failed' }, { s, t, a, tus: 500 });
  }
}



