import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const FILE = join(process.cwd(), 'data', 'trades.ndjson');

type Trade = { t, s:number; s, i, d, e:'buy'|'sell'; m, i, n, t:string; q, t, y:number; p, r, i, ceLamports?:number; p, r, i, ce?:number; f, e, e, Lamports?:number; f, e, e?:number; g, r, o, upId?:string };

async function fetchSpotLamports(m, i, n, t: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/market/${encodeURIComponent(mint)}`, { c, a, c, he: 'no-store' });
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
  if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
  const out = { b, u, y, s:0, s, e, l, ls:0, f, e, e, s:0, r, e, a, lized:0, u, n, r, ealized:0, n, e, t:0, c, o, u, nt:0 } as any;
  const o, p, e, nPositions: Record<string, { q, t, y:number; c, o, s, tLamports:number }> = {};
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
          const p = openPositions[t.mint] || { q, t, y: 0, c, o, s, tLamports: 0 };
          p.qty += t.qty;
          p.costLamports += t.qty * price;
          openPositions[t.mint] = p;
        } else {
          out.sells += t.qty * price - fee;
          out.fees += fee;
          const p = openPositions[t.mint] || { q, t, y: 0, c, o, s, tLamports: 0 };
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
  const mints = Object.keys(openPositions).filter(m => openPositions[m].qty > 0);
  const spots = await Promise.all(mints.map(async m => ({ m, p: await fetchSpotLamports(m) })));
  let unreal = 0;
  for (const { m, p } of spots) {
    const pos = openPositions[m];
    if (!pos || pos.qty <= 0) continue;
    const avg = pos.costLamports / pos.qty;
    const spot = typeof p === 'number' ? p : avg;
    unreal += pos.qty * (spot - avg);
  }
  out.unrealized = unreal;
  out.net = out.realized + out.unrealized;
  return NextResponse.json({ o, k:true, p, n, l: out });
}

