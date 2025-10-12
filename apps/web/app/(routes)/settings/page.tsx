"use client";
import { useEffect, useState } from "react";
import { useDaemonWS } from "../../../lib/ws";

export default function Settings() {
  const { send } = useDaemonWS();
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [rpcOk, setRpcOk] = useState<boolean>(false);
  const [jitoOk, setJitoOk] = useState<boolean>(false);

  useEffect(() => {
    // Listen via global WS events print; minimal placeholder until store wiring
    const fn = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.kind === "HEALTH") {
          setRpcOk(!!msg.rpcOk);
          setJitoOk(!!msg.jitoOk);
          setLastPing(msg.pingMs ?? null);
        }
      } catch {}
    };
    // Attach to the current WS instance if available
    const ws: any = (window as any).__daemon_ws__;
    if (ws) ws.addEventListener("message", fn);
    return () => { if (ws) ws.removeEventListener("message", fn); };
  }, [send]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Settings</h2>
      <div style={{ display: "flex", gap: 12 }}>
        <Status label="RPC" ok={rpcOk} />
        <Status label="Jito" ok={jitoOk} />
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>Ping: {lastPing ?? "-"} ms</div>
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


