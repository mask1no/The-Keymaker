import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const FILE = join(process.cwd(), 'data', 'trades.ndjson');

type Trade = { ts:number; side:'buy'|'sell'; mint:string; qty:number; price:number; fee?:number; groupId?:string };

export async function GET(){
  const out = { buys:0, sells:0, fees:0, realized:0, net:0, count:0 };
  if (existsSync(FILE)) {
    const lines = readFileSync(FILE,'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const t = JSON.parse(line) as Trade;
        out.count++;
        if (t.side==='buy') { out.buys += t.qty * t.price + (t.fee||0); out.fees += (t.fee||0); }
        else { out.sells += t.qty * t.price - (t.fee||0); out.fees += (t.fee||0); }
      } catch {}
    }
  }
  out.realized = out.sells - out.buys;
  out.net = out.realized;
  return NextResponse.json({ ok:true, pnl: out });
}
