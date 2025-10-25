"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{ coins: number; fillsToday: number; earningsToday: number; volume24h: number; mints: any[] }>({ coins: 0, fillsToday: 0, earningsToday: 0, volume24h: 0, mints: [] });
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
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>The Keymaker</h1>
      {err && <div style={{ color: "#ef4444", fontSize: 12 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Kpi label="Coins" value={stats.coins} />
        <Kpi label="Volume 24h" value={stats.volume24h} />
        <Kpi label="Fills Today" value={stats.fillsToday} />
        <Kpi label="Earnings Today" value={stats.earningsToday} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <h3 style={{ fontWeight: 600 }}>Recent Mints</h3>
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>
          {stats.mints?.length ? stats.mints.map((m:any, i:number)=> <div key={i}>{m}</div>) : "No data"}
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
      <div style={{ fontSize: 12, color: "#a1a1aa" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}


