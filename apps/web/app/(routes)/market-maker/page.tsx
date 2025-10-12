"use client";
import { useDaemonWS } from "../../../lib/ws";
import { useApp } from "../../../lib/store";
import { useEffect, useState } from "react";

export default function MarketMaker() {
  const { send } = useDaemonWS();
  const { masterWallet } = useApp();
  const [ca, setCa] = useState("");
  const [mode, setMode] = useState<"SNIPE" | "MM">("SNIPE");
  const [log, setLog] = useState<Array<{ ts: number; state: string; info?: any }>>([]);

  useEffect(() => {
    const ws: WebSocket | undefined = (window as any).__daemon_ws__;
    if (!ws) return;
    const onMsg = (e: MessageEvent) => {
      try {
        const m = JSON.parse(e.data);
        if (m.kind === "TASK_EVENT") setLog((l)=>[...l, { ts: Date.now(), state: m.state, info: m.info }]);
      } catch {}
    };
    ws.addEventListener("message", onMsg);
    return () => ws.removeEventListener("message", onMsg);
  }, []);

  function startTask() {
    send({
      kind: "TASK_CREATE",
      payload: {
        mode,
        ca,
        params:
          mode === "SNIPE"
            ? { slippageBps: 500, delayMsRange: [50, 150], walletFolderId: "default", walletCount: 5, maxSolPerWallet: 0.25 }
            : { slippageBps: 700, delayMsRange: [300, 800], walletFolderId: "default", walletCount: 8, minOrderSol: 0.02, maxOrderSol: 0.08, maxTxPerMin: 30, maxSessionSol: 5 }
      },
      meta: { masterWallet }
    });
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Market Maker / Snipe</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 200px 200px" }}>
          <input style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} placeholder="Paste token CA" value={ca} onChange={(e) => setCa(e.target.value)} />
          <select style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="SNIPE">Snipe</option>
            <option value="MM">Volume / MM</option>
          </select>
          <button style={{ padding: "8px 16px", borderRadius: 12, background: "#059669" }} onClick={startTask}>
            Start Task
          </button>
        </div>
      </div>
      <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Task Log</h3>
        <div style={{ display: "grid", gap: 6 }}>
          {log.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: r.state === "FAIL" ? "#ef4444" : "#a1a1aa" }}>
              {new Date(r.ts).toLocaleTimeString()} — {r.state} {r.info ? JSON.stringify(r.info) : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


