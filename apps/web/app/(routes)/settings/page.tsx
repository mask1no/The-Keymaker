"use client";
import { useEffect, useState } from "react";
import { useDaemonWS } from "../../../lib/ws";
import { useApp } from "../../../lib/store";

export default function Settings() {
  const { send } = useDaemonWS();
  const { wsConnected } = useApp();
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [rpcOk, setRpcOk] = useState<boolean>(false);
  const [jitoOk, setJitoOk] = useState<boolean>(false);
  const [cluster, setCluster] = useState<string>("-");
  const [rpcUrl, setRpcUrl] = useState<string>("");
  const [grpcEndpoint, setGrpcEndpoint] = useState<string>("");
  const [jitoBlockEngine, setJitoBlockEngine] = useState<string>("");
  const [runEnabled, setRunEnabled] = useState<boolean>(true);
  const [launchPlatform, setLaunchPlatform] = useState<string>("");
  const [rpcUrls, setRpcUrls] = useState<string>("");
  const [defSlipBps, setDefSlipBps] = useState<string>("");
  const [defCuPrice, setDefCuPrice] = useState<string>("");
  const [defTipBuy, setDefTipBuy] = useState<string>("");
  const [defTipSell, setDefTipSell] = useState<string>("");
  // Auto-snipe
  const [autoEnabled, setAutoEnabled] = useState<boolean>(false);
  const [autoFolder, setAutoFolder] = useState<string>("");
  const [autoWallets, setAutoWallets] = useState<string>("3");
  const [autoBuySol, setAutoBuySol] = useState<string>("0.01");
  const [autoSlip, setAutoSlip] = useState<string>("");
  const [autoMode, setAutoMode] = useState<string>("JITO_BUNDLE");
  const [autoJitterMin, setAutoJitterMin] = useState<string>("20");
  const [autoJitterMax, setAutoJitterMax] = useState<string>("120");
  const [autoCuMin, setAutoCuMin] = useState<string>("800");
  const [autoCuMax, setAutoCuMax] = useState<string>("1500");
  const [autoTipMin, setAutoTipMin] = useState<string>("0");
  const [autoTipMax, setAutoTipMax] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fn = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.kind === "HEALTH") {
          setRpcOk(!!msg.rpcOk);
          setJitoOk(!!msg.jitoOk);
          setLastPing(msg.pingMs ?? null);
          if (msg.cluster) setCluster(String(msg.cluster));
        }
        if (msg.kind === "SETTINGS") {
          setRpcUrl(msg.settings?.RPC_URL || "");
          setRpcUrls(msg.settings?.RPC_URLS || "");
          setGrpcEndpoint(msg.settings?.GRPC_ENDPOINT || "");
          setJitoBlockEngine(msg.settings?.JITO_BLOCK_ENGINE || "");
          setRunEnabled(!!msg.settings?.RUN_ENABLED);
          setLaunchPlatform(msg.settings?.LAUNCH_PLATFORM || "");
          setDefSlipBps(String(msg.settings?.DEFAULT_SLIPPAGE_BPS || ""));
          setDefCuPrice(String(msg.settings?.DEFAULT_CU_PRICE_MICRO || ""));
          setDefTipBuy(String(msg.settings?.DEFAULT_JITO_TIP_BUY_LAMPORTS || ""));
          setDefTipSell(String(msg.settings?.DEFAULT_JITO_TIP_SELL_LAMPORTS || ""));
          // autosnipe
          setAutoEnabled((msg.settings?.AUTOSNIPE_ENABLED || "") === "1");
          setAutoFolder(msg.settings?.AUTOSNIPE_FOLDER_ID || "");
          setAutoWallets(String(msg.settings?.AUTOSNIPE_WALLET_COUNT || "3"));
          setAutoBuySol(String(msg.settings?.AUTOSNIPE_BUY_SOL || "0.01"));
          setAutoSlip(String(msg.settings?.AUTOSNIPE_SLIPPAGE_BPS || ""));
          setAutoMode(msg.settings?.AUTOSNIPE_EXEC_MODE || "JITO_BUNDLE");
          setAutoJitterMin(String(msg.settings?.AUTOSNIPE_JITTER_MIN_MS || "20"));
          setAutoJitterMax(String(msg.settings?.AUTOSNIPE_JITTER_MAX_MS || "120"));
          setAutoCuMin(String(msg.settings?.AUTOSNIPE_CU_MIN || "800"));
          setAutoCuMax(String(msg.settings?.AUTOSNIPE_CU_MAX || "1500"));
          setAutoTipMin(String(msg.settings?.AUTOSNIPE_TIP_MIN || "0"));
          setAutoTipMax(String(msg.settings?.AUTOSNIPE_TIP_MAX || "0"));
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
        { key: "RPC_URLS", value: rpcUrls },
        { key: "GRPC_ENDPOINT", value: grpcEndpoint },
        { key: "JITO_BLOCK_ENGINE", value: jitoBlockEngine },
        { key: "LAUNCH_PLATFORM", value: launchPlatform },
        { key: "DEFAULT_SLIPPAGE_BPS", value: defSlipBps },
        { key: "DEFAULT_CU_PRICE_MICRO", value: defCuPrice },
        { key: "DEFAULT_JITO_TIP_BUY_LAMPORTS", value: defTipBuy },
        { key: "DEFAULT_JITO_TIP_SELL_LAMPORTS", value: defTipSell },
        // autosnipe
        { key: "AUTOSNIPE_ENABLED", value: autoEnabled ? "1" : "0" },
        { key: "AUTOSNIPE_FOLDER_ID", value: autoFolder },
        { key: "AUTOSNIPE_WALLET_COUNT", value: autoWallets },
        { key: "AUTOSNIPE_BUY_SOL", value: autoBuySol },
        { key: "AUTOSNIPE_SLIPPAGE_BPS", value: autoSlip },
        { key: "AUTOSNIPE_EXEC_MODE", value: autoMode },
        { key: "AUTOSNIPE_JITTER_MIN_MS", value: autoJitterMin },
        { key: "AUTOSNIPE_JITTER_MAX_MS", value: autoJitterMax },
        { key: "AUTOSNIPE_CU_MIN", value: autoCuMin },
        { key: "AUTOSNIPE_CU_MAX", value: autoCuMax },
        { key: "AUTOSNIPE_TIP_MIN", value: autoTipMin },
        { key: "AUTOSNIPE_TIP_MAX", value: autoTipMax },
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
      <div style={{ fontSize: 12, color: "#9aa0b4" }}>
        Manual RPC controls: update RPC URL to switch clusters/providers; Jito Block Engine enables Jito modes; Helius gRPC enables live listener. Defaults below are injected on task create.
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Status label="WS" ok={wsConnected} />
        <Status label="RPC" ok={rpcOk} />
        <Status label="Jito" ok={jitoOk} />
        <Status label={`Solana ${cluster === '-' ? '' : cluster}`} ok={cluster === "mainnet"} />
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>Ping: {lastPing ?? "-"} ms</div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>RPC URL</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={rpcUrl} onChange={(e)=>setRpcUrl(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>RPC URLs (comma/space-separated)</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={rpcUrls} onChange={(e)=>setRpcUrls(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Jito Block Engine</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={jitoBlockEngine} onChange={(e)=>setJitoBlockEngine(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Helius gRPC Endpoint</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={grpcEndpoint} onChange={(e)=>setGrpcEndpoint(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Launch Platform</label>
          <select className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={launchPlatform} onChange={(e)=>setLaunchPlatform(e.target.value)}>
            <option value="">None</option>
            <option value="Axiom">Axiom</option>
            <option value="GMGN">GMGN</option>
            <option value="Photon">Photon</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Default Slippage (bps)</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={defSlipBps} onChange={(e)=>setDefSlipBps(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Default CU Price (micro)</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={defCuPrice} onChange={(e)=>setDefCuPrice(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Default Jito Tip (buy)</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={defTipBuy} onChange={(e)=>setDefTipBuy(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-xs" style={{ color: "#a1a1aa" }}>Default Jito Tip (sell)</label>
          <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={defTipSell} onChange={(e)=>setDefTipSell(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #3f3f46" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Auto-Snipe</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Enabled</label>
            <input type="checkbox" checked={autoEnabled} onChange={(e)=>setAutoEnabled(e.target.checked)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Folder ID</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoFolder} onChange={(e)=>setAutoFolder(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Wallets</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoWallets} onChange={(e)=>setAutoWallets(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Buy SOL per wallet</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoBuySol} onChange={(e)=>setAutoBuySol(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Slippage (bps)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoSlip} onChange={(e)=>setAutoSlip(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Exec Mode</label>
            <select className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoMode} onChange={(e)=>setAutoMode(e.target.value)}>
              <option value="RPC_SPRAY">RPC_SPRAY</option>
              <option value="JITO_BUNDLE">JITO_BUNDLE</option>
              <option value="JITO_LITE">JITO_LITE</option>
              <option value="JITO_DIRECT">JITO_DIRECT</option>
              <option value="STEALTH_STRETCH">STEALTH_STRETCH</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Jitter (ms, min)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoJitterMin} onChange={(e)=>setAutoJitterMin(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Jitter (ms, max)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoJitterMax} onChange={(e)=>setAutoJitterMax(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>CU Price (micro, min)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoCuMin} onChange={(e)=>setAutoCuMin(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>CU Price (micro, max)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoCuMax} onChange={(e)=>setAutoCuMax(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Jito Tip (lamports, min)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoTipMin} onChange={(e)=>setAutoTipMin(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs" style={{ color: "#a1a1aa" }}>Jito Tip (lamports, max)</label>
            <input className="px-3 py-2 rounded-xl" style={{ background: "#27272a", border: "1px solid #3f3f46" }} value={autoTipMax} onChange={(e)=>setAutoTipMax(e.target.value)} />
          </div>
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


