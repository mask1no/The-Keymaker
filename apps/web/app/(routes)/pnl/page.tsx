"use client";
import { useEffect, useState } from "react";

export default function PnL() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        setLoading(true);
        const base = process.env.NEXT_PUBLIC_WS_URL?.replace(/^ws/, "http") || "http://localhost:8787";
        const res = await fetch(`${base}/pnl`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!dead) setItems(j.items || []);
      } catch (e:any) {
        if (!dead) setErr(e.message);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>PnL</h2>
      {err && <div style={{ color: "#ef4444", fontSize: 12 }}>{err}</div>}
      {loading ? (
        <div style={{ color: "#a1a1aa" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.length === 0 && <div style={{ color: "#a1a1aa", fontSize: 12 }}>No fills yet.</div>}
          {items.map((it:any) => (
            <div key={it.ca} style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
              <div style={{ fontWeight: 600 }}>{it.ca}</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>Fills: {it.totals?.fills ?? 0} • Fees: {it.totals?.feesLamports ?? 0} • Tips: {it.totals?.tipsLamports ?? 0}</div>
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {(it.positions || []).map((p:any, idx:number) => (
                  <div key={idx} style={{ fontSize: 12, color: "#a1a1aa" }}>{p.wallet} — fills: {p.fills} — fees: {p.feesLamports} — tips: {p.tipsLamports}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


