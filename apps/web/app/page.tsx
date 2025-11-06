"use client";
import { useEffect, useState } from "react";
import { BentoGrid, StatCard, PanelCard } from "../components/Bento";

export default function Home() {
  const [stats, setStats] = useState<any>({ coins: 0, fillsToday: 0, earningsToday: 0, volume24h: 0, mints: [], series: { volume: [], coins: [] } });
  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_WS_URL?.replace(/^ws/, "http") || "http://localhost:8787";
        const res = await fetch(`${base}/stats`, { cache: "no-store" });
        const j = await res.json();
        if (!dead) setStats(j);
      } catch {}
    }
    load(); const id = setInterval(load, 10000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  return (
    <main className="p-6 grid gap-4">
      <BentoGrid cols={12} gap={12}>
        <StatCard title="Volume (24h)" value={stats.volume24h} hint="fills in last 24h" icon="Σ" span={3} />
        <StatCard title="Coins (all time)" value={stats.coins} hint="distinct CAs" icon="◎" span={3} />
        <StatCard title="Fills today" value={stats.fillsToday} hint="since 00:00" icon="↕" span={3} />
        <StatCard title="Earnings today" value={(stats.earningsToday/1e9).toFixed(4)+" SOL"} hint="-(fees+tips)" icon="±" span={3} />
        <div style={{ gridColumn: "span 12 / span 12" }}>
          <PanelCard title="Wallet Groups" right={<a href="/wallets" className="pill" style={{ padding: "6px 10px", fontSize: 12 }}>Open Wallets</a>}>
            <div style={{ fontSize: 12, color: "#9aa0b4" }}>Manage folders and wallets from the Wallets page. Recent coins: {stats.mints?.slice(0,5).join(", ")||"—"}</div>
          </PanelCard>
        </div>
      </BentoGrid>
    </main>
  );
}
