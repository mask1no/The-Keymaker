import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSession } from '@/lib/server/session';
import { aggregatePnL as aggregateFromDb } from '@/lib/db/sqlite';

export const dynamic = 'force-dynamic';

const FILE = join(process.cwd(), 'data', 'trades.ndjson');

type Trade = { ts:number; side:'buy'|'sell'; mint:string; qty:number; priceLamports?:number; price?:number; feeLamports?:number; fee?:number; groupId?:string };

async function fetchSpotLamports(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/market/${encodeURIComponent(mint)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    // Prefer direct lamportsPerToken if provided by endpoint; else convert USD→lamports is not available here
    if (typeof j?.lamportsPerToken === 'string') return Number(j.lamportsPerToken);
    if (typeof j?.lamportsPerToken === 'number') return j.lamportsPerToken;
    return null;
  } catch { return null; }
}

export async function GET(){
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const out = { buys:0, sells:0, fees:0, realized:0, unrealized:0, net:0, count:0 } as any;
  // Preferred path: compute from DB if present
  try {
    const prices: Record<string, number> = {};
    const agg = aggregateFromDb(prices);
    out.buys = agg.buysLamports / 1e9;
    out.sells = agg.sellsLamports / 1e9;
    out.fees = agg.feesLamports / 1e9;
    out.realized = agg.realizedLamports / 1e9;
    out.unrealized = agg.unrealizedLamports / 1e9;
    out.net = agg.netLamports / 1e9;
    return NextResponse.json({ ok:true, pnl: out });
  } catch {}
  const openPositions: Record<string, { qty:number; costLamports:number }> = {};
  if (existsSync(FILE)) {
    const lines = readFileSync(FILE,'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const t = JSON.parse(line) as Trade;
        out.count++;
        const price = typeof t.priceLamports === 'number' ? t.priceLamports : (typeof t.price === 'number' ? t.price : 0);
        const fee = typeof t.feeLamports === 'number' ? t.feeLamports : (typeof t.fee === 'number' ? t.fee : 0);
        if (t.side==='buy') {
          out.buys += t.qty * price + fee;
          out.fees += fee;
          const p = openPositions[t.mint] || { qty: 0, costLamports: 0 };
          p.qty += t.qty;
          p.costLamports += t.qty * price;
          openPositions[t.mint] = p;
        } else {
          out.sells += t.qty * price - fee;
          out.fees += fee;
          const p = openPositions[t.mint] || { qty: 0, costLamports: 0 };
          const qtyOut = Math.min(p.qty, t.qty);
          if (qtyOut > 0) {
            const avg = p.qty > 0 ? p.costLamports / p.qty : 0;
            p.qty -= qtyOut;
            p.costLamports -= qtyOut * avg;
            openPositions[t.mint] = p;
          }
        }
      } catch {}
    }
  }
  out.realized = out.sells - out.buys;
  // Compute unrealized using spot for remaining qty
  const mints = Object.keys(openPositions).filter((mint) => openPositions[mint].qty > 0);
  const spotByMint: Record<string, number | null> = {};
  for (const mint of mints) {
    spotByMint[mint] = await fetchSpotLamports(mint);
  }
  let unreal = 0;
  for (const mint of mints) {
    const pos = openPositions[mint];
    if (!pos || pos.qty <= 0) continue;
    const avg = pos.costLamports / pos.qty;
    const spot = typeof spotByMint[mint] === 'number' ? (spotByMint[mint] as number) : avg;
    unreal += pos.qty * (spot - avg);
  }
  out.unrealized = unreal;
  out.net = out.realized + out.unrealized;
  return NextResponse.json({ ok:true, pnl: out });
}

