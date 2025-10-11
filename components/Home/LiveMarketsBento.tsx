'use client';
import React from 'react';

type Item = {
  symbol: 'BTC' | 'ETH' | 'SOL' | 'CAKE';
  price: number;
  change24h: number;
  logoUrl: string;
  stale?: boolean;
  staleMs?: number;
};

export default function LiveMarketsBento() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [stale, setStale] = React.useState<boolean>(false);

  React.useEffect(() => {
    let stopped = false;
    let t: any;
    async function tick() {
      try {
        const r = await fetch('/api/markets/tickers', { cache: 'no-store' });
        const j = await r.json();
        if (!stopped && Array.isArray(j?.data)) {
          setItems(j.data);
          setStale(Boolean(j?.data?.[0]?.stale));
        }
      } catch {
        // ignore provider hiccups
      } finally {
        if (!stopped) t = setTimeout(tick, 5000);
      }
    }
    tick();
    return () => {
      stopped = true;
      if (t) clearTimeout(t);
    };
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/40">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Live Markets</div>
        {stale ? <div className="text-[10px] text-zinc-500">stale</div> : null}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it) => {
          const pct = Number(it.change24h || 0);
          const pctCls = pct >= 0 ? 'text-[--k-success]' : 'text-[--k-danger]';
          return (
            <div key={it.symbol} className="flex items-center gap-3">
              <img src={it.logoUrl} alt={it.symbol} className="w-6 h-6 rounded-full" />
              <div className="flex flex-col leading-tight">
                <div className="text-xs text-zinc-400">{it.symbol}</div>
                <div className="text-sm font-medium">${it.price.toFixed(2)}</div>
              </div>
              <div className={`ml-auto text-xs font-medium ${pctCls}`}>{pct.toFixed(2)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
