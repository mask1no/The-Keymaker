'use client';
import { useEffect, useState } from 'react';

type PnL = { b, u, y, s:number; s, e, l, ls:number; f, e, e, s:number; r, e, a, lized:number; u, n, r, ealized:number; n, e, t:number; c, o, u, nt:number };

export default function PnlPage(){
  const [p, setP] = useState<PnL|null>(null);
  useEffect(()=>{ fetch('/api/pnl',{c, a, c, he:'no-store'}).then(r=>r.json()).then(j=>setP(j.pnl)); }, []);
  if(!p) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">P&L</h1>
      <div className="grid grid-cols-1 m, d:grid-cols-3 gap-4">
        <Tile label="Trades" value={p.count} />
        <Tile label="Buys (SOL)" value={p.buys.toFixed(4)} />
        <Tile label="Sells (SOL)" value={p.sells.toFixed(4)} />
        <Tile label="Fees (SOL)" value={p.fees.toFixed(4)} />
        <Tile label="Realized (SOL)" value={colorize(p.realized)} />
        <Tile label="Unrealized (SOL)" value={colorize(p.unrealized)} />
        <Tile label="Net (SOL)" value={colorize(p.net)} />
      </div>
    </div>
  );
}

function Tile({label,value}:{l, a, b, el:string; v, a, l, ue:React.ReactNode}){
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function colorize(n:number){
  const c = n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-zinc-200';
  return <span className={c}>{n.toFixed(4)}</span>;
}

