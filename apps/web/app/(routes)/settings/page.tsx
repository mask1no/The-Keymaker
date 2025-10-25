"use client";
import { useEffect, useState } from "react";
import { useDaemonWS } from "../../../lib/ws";

export default function Settings() {
  const { send } = useDaemonWS();
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [rpcOk, setRpcOk] = useState<boolean>(false);
  const [jitoOk, setJitoOk] = useState<boolean>(false);
  const [rpcUrl, setRpcUrl] = useState<string>("");
  const [grpcEndpoint, setGrpcEndpoint] = useState<string>("");
  const [jitoBlockEngine, setJitoBlockEngine] = useState<string>("");
  const [runEnabled, setRunEnabled] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fn = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.kind === "HEALTH") {
          setRpcOk(!!msg.rpcOk);
          setJitoOk(!!msg.jitoOk);
          setLastPing(msg.pingMs ?? null);
        }
        if (msg.kind === "SETTINGS") {
          setRpcUrl(msg.settings?.RPC_URL || "");
          setGrpcEndpoint(msg.settings?.GRPC_ENDPOINT || "");
          setJitoBlockEngine(msg.settings?.JITO_BLOCK_ENGINE || "");
          setRunEnabled(!!msg.settings?.RUN_ENABLED);
        }
      } catch {}
    };
    const ws: any = (window as any).__daemon_ws__;
    if (ws) ws.addEventListener("message", fn);
    // request current settings on mount
    send({ kind: "SETTINGS_GET" } as any);
    return () => { if (ws) ws.removeEventListener("message", fn); };
  }, [send]);

  async function save() {
    try {
      setSaving(true);
      send({ kind: "SETTINGS_SET", payload: { entries: [
        { key: "RPC_URL", value: rpcUrl },
        { key: "GRPC_ENDPOINT", value: grpcEndpoint },
        { key: "JITO_BLOCK_ENGINE", value: jitoBlockEngine }
      ] } } as any);
    } finally {
      setSaving(false);
    }
  }

  function toggleKill() {
    setRunEnabled((b)=>{
      const next = !b;
      send({ kind: "KILL_SWITCH", payload: { enabled: next } } as any);
      return next;
    });
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Settings</h2>
      <div style={{ display: "flex", gap: 12 }}>
        <Status label="RPC" ok={rpcOk} />
        <Status label="Jito" ok={jitoOk} />
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>Ping: {lastPing ?? "-"} ms</div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>RPC URL</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={rpcUrl} onChange={(e)=>setRpcUrl(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Jito Block Engine</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={jitoBlockEngine} onChange={(e)=>setJitoBlockEngine(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Helius gRPC Endpoint</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={grpcEndpoint} onChange={(e)=>setGrpcEndpoint(e.target.value)} />
        </div>
      </div>
      <div>
        <button onClick={save} disabled={saving} style={{ padding: "8px 16px", borderRadius: 12, background: saving ? "#374151" : "#059669" }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={toggleKill} style={{ padding: "8px 16px", borderRadius: 12, marginLeft: 8, background: runEnabled ? "#7f1d1d" : "#065f46" }}>
          {runEnabled ? "Disable (Kill)" : "Enable"}
        </button>
      </div>
    </div>
  );
}

function Status({ label, ok }: { label: string; ok: boolean }) {
  const color = ok ? "#10b981" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
      <span style={{ fontSize: 12 }}>{label}</span>
    </div>
  );
}


