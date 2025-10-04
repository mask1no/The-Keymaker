import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function birdeyeByCA(ca: string){
  const key = process.env.BIRDEYE_API_KEY || '';
  if (!key) return null;
  const r = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(ca)}`, {
    headers: { 'X-API-KEY': key, 'accept': 'application/json' },
    cache: 'no-store'
  });
  if (!r.ok) return null;
  const j: any = await r.json().catch(()=>null);
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

async function dexByCA(ca: string){
  const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`, { cache: 'no-store' });
  if (!r.ok) return null;
  const j: any = await r.json().catch(()=>null);
  const p = j?.pairs?.[0];
  if(!p) return null;
  return {
    ca,
    name: p.baseToken?.name || '',
    symbol: p.baseToken?.symbol || '',
    image: p.info?.imageUrl || '',
    website: p.info?.websites?.[0]?.url || '',
    twitter: p.info?.socials?.find((s:any)=>s.type==='twitter')?.url || '',
    telegram: p.info?.socials?.find((s:any)=>s.type==='telegram')?.url || '',
  };
}

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const ca = searchParams.get('ca') || '';
  if (!ca) return NextResponse.json({ ok:false, error:'missing ca' }, { status: 400 });

  const be = await birdeyeByCA(ca);
  const out = be || await dexByCA(ca);
  if (!out) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });

  return NextResponse.json({ ok:true, coin: out });
}


