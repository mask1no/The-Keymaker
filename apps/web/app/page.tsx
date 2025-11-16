"use client";
import { useEffect, useMemo, useState } from "react";
import Sparkline from "../components/Sparkline";

export default function Home() {
  const [stats, setStats] = useState<any>({ coins: 0, fillsToday: 0, earningsToday: 0, volume24h: 0, mints: [], series: { volume: [], coins: [] } });
  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const res = await fetch(`/api/stats`, { cache: "no-store" });
        const j = await res.json();
        if (!dead) setStats(j);
      } catch {}
    }
    load(); const id = setInterval(load, 10000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  const now = useMemo(() => new Date(), []);
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      {/* Hero */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#221a3a] via-[#1a1030] to-[#0f0f16] p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-3xl font-bold">Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}.</div>
            <div className="text-zinc-400 mt-1">{dateStr}</div>
          </div>
          <div className="hidden md:block">
            <Sparkline data={Array.isArray(stats?.series?.coins) ? stats.series.coins : []} width={360} height={80} />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Volume (24h)" value={stats.volume24h} hint="fills" series={stats?.series?.volume||[]} />
        <Kpi title="Coins (all time)" value={stats.coins} hint="distinct CAs" series={stats?.series?.coins||[]} />
        <Kpi title="Fills today" value={stats.fillsToday} hint="since 00:00" series={stats?.series?.volume||[]} />
        <Kpi title="Earnings today" value={`${(stats.earningsToday/1e9).toFixed(4)} SOL`} hint="-(fees+tips)" series={stats?.series?.coins||[]} />
      </div>

      {/* Wallets CTA removed (folders live under /wallets) */}

      {/* Mint History */}
      <div className="grid gap-3">
        <div className="text-lg font-semibold">Mint History</div>
        <div className="grid gap-3 md:grid-cols-2">
          {(stats.mints || []).slice(0, 6).map((m: string, i: number) => (
            <a key={m+":"+i} href={`https://dexscreener.com/solana/${encodeURIComponent(m)}`} target="_blank" rel="noreferrer"
               className="rounded-xl border border-zinc-800 bg-[#121217] p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 grid place-items-center text-[var(--accent)]">◎</div>
                <div className="text-sm">
                  <div className="font-medium">CA</div>
                  <div className="text-zinc-400 font-mono">{m.slice(0,6)}…{m.slice(-6)}</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs">View</span>
            </a>
          ))}
          {(!stats.mints || stats.mints.length === 0) && (
            <div className="text-sm text-zinc-400">No recent mints.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, hint, series }: { title: string; value: any; hint?: string; series: number[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#13131a] p-4">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value ?? 0}</div>
      {hint && <div className="text-xs text-zinc-500">{hint}</div>}
      <div className="mt-3">
        <Sparkline data={Array.isArray(series) ? series : []} width={280} height={54} />
      </div>
    </div>
  );
}
