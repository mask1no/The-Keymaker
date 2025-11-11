"use client";
import { useDaemonWS } from "../../../lib/ws";
import { useApp } from "../../../lib/store";
import { useEffect, useState } from "react";

export default function MarketMaker() {
  const { send, onMessage } = useDaemonWS();
  const { masterWallet, folders, setFolders } = useApp();
  const [ca, setCa] = useState("");
  const [mode, setMode] = useState<"SNIPE" | "SELL" | "MM">("SNIPE");
  const [execMode, setExecMode] = useState<"RPC_SPRAY"|"STEALTH_STRETCH"|"JITO_LITE"|"JITO_BUNDLE">("RPC_SPRAY");
  const [walletFolderId, setWalletFolderId] = useState("");
  const [walletCount, setWalletCount] = useState(2);
  const [maxSolPerWallet, setMaxSolPerWallet] = useState(0.005);
  const [slippageBps, setSlippageBps] = useState(500);
  const [jitterMin, setJitterMin] = useState(50);
  const [jitterMax, setJitterMax] = useState(150);
  const [tipMin, setTipMin] = useState(0);
  const [tipMax, setTipMax] = useState(0);
  const [cuMin, setCuMin] = useState(0);
  const [cuMax, setCuMax] = useState(0);
  const [log, setLog] = useState<Array<{ ts: number; state: string; info?: any }>>([]);
  const [sellPct, setSellPct] = useState(50);
  const [jitoOk, setJitoOk] = useState<boolean>(false);
  const [rpcConcurrency, setRpcConcurrency] = useState(6);

  useEffect(() => {
    const off = onMessage((m:any)=>{
      if (m.kind === "HEALTH") setJitoOk(!!m.jitoOk);
      if (m.kind === "FOLDERS") setFolders(m.folders || []);
    });
    send({ kind: "FOLDER_LIST" } as any);
    return off;
  }, []);

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
    const base = { execMode, jitterMs: [jitterMin, jitterMax] as [number, number], tipLamports: [tipMin, tipMax] as [number, number], cuPrice: [cuMin, cuMax] as [number, number], walletFolderId, walletCount, rpcConcurrency };
    const payload = mode === "SNIPE"
      ? { kind: mode, ca, params: { ...base, maxSolPerWallet, slippageBps } }
      : mode === "MM"
        ? { kind: mode, ca, params: { ...base, minOrderSol: 0.01, maxOrderSol: 0.03, slippageBps, maxTxPerMin: 2, maxSessionSol: 0.02 } }
        : { kind: "SELL", ca, params: { ...base, percent: sellPct, slippageBps } };
    send({ kind: "TASK_CREATE", payload, meta: { masterWallet } });
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
            <option value="SELL">Sell</option>
          </select>
          <button style={{ padding: "8px 16px", borderRadius: 12, background: "#059669" }} onClick={startTask}>
            Start Task
          </button>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(6, 1fr)", marginTop: 12 }}>
          <select value={execMode} onChange={(e)=>setExecMode(e.target.value as any)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }}>
            <option value="RPC_SPRAY">RPC_SPRAY</option>
            <option value="STEALTH_STRETCH">STEALTH_STRETCH</option>
            {jitoOk && <option value="JITO_LITE">JITO_LITE</option>}
            {jitoOk && <option value="JITO_BUNDLE">JITO_BUNDLE</option>}
          </select>
          <select value={walletFolderId} onChange={(e)=>setWalletFolderId(e.target.value)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }}>
            <option value="">Folder…</option>
            {folders.map((f:any)=>(<option key={f.id} value={f.id}>{f.name} ({f.count})</option>))}
          </select>
          <input type="number" placeholder="# wallets" value={walletCount} onChange={(e)=>setWalletCount(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" step="0.001" placeholder="max SOL/wallet" value={maxSolPerWallet} onChange={(e)=>setMaxSolPerWallet(parseFloat(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="slippage bps" value={slippageBps} onChange={(e)=>setSlippageBps(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="sell %" value={sellPct} onChange={(e)=>setSellPct(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="jitter min ms" value={jitterMin} onChange={(e)=>setJitterMin(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="jitter max ms" value={jitterMax} onChange={(e)=>setJitterMax(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="tip min" value={tipMin} onChange={(e)=>setTipMin(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="tip max" value={tipMax} onChange={(e)=>setTipMax(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="cu min" value={cuMin} onChange={(e)=>setCuMin(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input type="number" placeholder="cu max" value={cuMax} onChange={(e)=>setCuMax(parseInt(e.target.value||"0"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          {(execMode === "RPC_SPRAY" || execMode === "STEALTH_STRETCH") && (
            <input type="number" min={1} placeholder="rpc concurrency" value={rpcConcurrency} onChange={(e)=>setRpcConcurrency(parseInt(e.target.value||"1"))} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          )}
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


