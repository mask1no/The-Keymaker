'use client';
import { useEffect, useState } from 'react';

type PnL = { buys:number; sells:number; fees:number; realized:number; net:number; count:number };

export default function PnlPage(){
  const [p, setP] = useState<PnL|null>(null);
  useEffect(()=>{ fetch('/api/pnl',{cache:'no-store'}).then(r=>r.json()).then(j=>setP(j.pnl)); }, []);
  if(!p) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">P&L</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tile label="Trades" value={p.count} />
        <Tile label="Buys (SOL)" value={p.buys.toFixed(4)} />
        <Tile label="Sells (SOL)" value={p.sells.toFixed(4)} />
        <Tile label="Fees (SOL)" value={p.fees.toFixed(4)} />
        <Tile label="Realized (SOL)" value={p.realized.toFixed(4)} />
        <Tile label="Net (SOL)" value={p.net.toFixed(4)} />
      </div>
    </div>
  );
}

function Tile({label,value}:{label:string; value:React.ReactNode}){
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
