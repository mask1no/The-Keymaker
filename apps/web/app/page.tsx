"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{ coins: number; fillsToday: number; earningsToday: number; volume24h: number; mints: any[]; series?: { volume: number[]; coins: number[] } }>({ coins: 0, fillsToday: 0, earningsToday: 0, volume24h: 0, mints: [], series: { volume: [], coins: [] } });
  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        setLoading(true);
        const base = process.env.NEXT_PUBLIC_WS_URL?.replace(/^ws/, "http") || "http://localhost:8787";
        const res = await fetch(`${base}/stats`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!dead) setStats(j);
      } catch (e:any) {
        if (!dead) setErr(e.message);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 10000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  return (
    <main className="p-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">The Keymaker</h1>
        {err && <div className="text-xs text-danger">{err}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CardKpi label="Coins" value={stats.coins} loading={loading} />
        <CardKpi label="Volume 24h" value={stats.volume24h} loading={loading} />
        <CardKpi label="Fills Today" value={stats.fillsToday} loading={loading} />
        <CardKpi label="Earnings Today" value={stats.earningsToday} loading={loading} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-[var(--card)] shadow-card">
          <div className="text-sm text-muted mb-2">Coin Report</div>
          <MiniSpark data={stats.series?.coins || []} loading={loading} />
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-[var(--card)] shadow-card">
          <div className="text-sm text-muted mb-2">Volume Report</div>
          <MiniSpark data={stats.series?.volume || []} loading={loading} />
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-[var(--card)] shadow-card">
          <div className="text-sm font-semibold mb-2">Mint History</div>
          <div className="grid gap-1 text-xs">
            {loading ? <Skeleton lines={6} /> : (stats.mints?.length ? stats.mints.map((m:any, i:number)=> (
              <a key={i} className="text-emerald-400 underline truncate" href={`/coin/${encodeURIComponent(m)}`}>{m}</a>
            )) : <div className="text-muted">No data</div>)}
          </div>
        </div>
      </div>
    </main>
  );
}

function CardKpi({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="p-4 rounded-2xl border border-zinc-800 bg-[var(--card)] shadow-card">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1">{loading ? <div className="h-7 bg-zinc-800 rounded" /> : value}</div>
    </div>
  );
}

function MiniSpark({ data, loading }: { data: number[]; loading: boolean }) {
  if (loading) return <Skeleton lines={1} />;
  const w = 260; const h = 56; const max = Math.max(1, ...data);
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={points} />
    </svg>
  );
}

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="grid gap-2">
      {new Array(lines).fill(0).map((_, i) => (
        <div key={i} className="h-4 bg-zinc-800 rounded" />
      ))}
    </div>
  );
}


