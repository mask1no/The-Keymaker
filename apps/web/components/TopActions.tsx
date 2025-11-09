"use client";
import { useEffect, useState } from "react";
import { useDaemonWS } from "@/lib/ws";
import { useApp } from "@/lib/store";

type DevPreset = { name: string; devBuySol: number; sniperWallets: number; mode: "STANDARD"|"BUNDLED" };
type VolumePreset = { name: string; buyPctMin: number; buyPctMax: number; delayMin: number; delayMax: number; tradesMin: number; tradesMax: number; tokenCount: number };
type PresetsStore = { dev: DevPreset[]; volume: VolumePreset[] };

function loadPresets(): PresetsStore { try { return JSON.parse(localStorage.getItem("keymaker.presets") || "{\"dev\":[],\"volume\":[]}"); } catch { return { dev: [], volume: [] }; } }
function savePresets(p: PresetsStore) { localStorage.setItem("keymaker.presets", JSON.stringify(p)); }

export default function TopActions() {
  const { send, onMessage } = useDaemonWS();
  const { masterWallet } = useApp();
  const [open, setOpen] = useState<null|"folders"|"presets"|"fastsell"|"returnsol">(null);
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [presets, setPresets] = useState<PresetsStore>({ dev: [], volume: [] });
  const [autoCreate, setAutoCreate] = useState(true);
  const [folderColor, setFolderColor] = useState("#6ee7b7");

  useEffect(() => { setPresets(loadPresets()); }, []);
  useEffect(() => {
    if (!open) return;
    const off = onMessage((m: any) => { if (m.kind === "FOLDERS") setFolders(m.folders || []); });
    send({ kind: "FOLDER_LIST" } as any);
    return off;
  }, [open, onMessage, send]);

  async function getLatestCA(): Promise<string | null> {
    return await new Promise((resolve) => {
      const off = onMessage((m: any) => {
        if (m.kind === "TASKS" && Array.isArray(m.items)) { off?.(); resolve(m.items[0]?.ca || null); }
      });
      send({ kind: "TASK_LIST" } as any);
      setTimeout(() => { off?.(); resolve(null); }, 1500);
    });
  }

  function saveDevPreset(p: DevPreset) { const next = { ...presets, dev: [...presets.dev.filter(d=>d.name!==p.name), p] }; setPresets(next); savePresets(next); }
  function saveVolumePreset(p: VolumePreset) { const next = { ...presets, volume: [...presets.volume.filter(d=>d.name!==p.name), p] }; setPresets(next); savePresets(next); }

  async function ensureFolderForRun(sniperWallets:number): Promise<string> {
    if (folderId) return folderId;
    const id = `auto-${Date.now()}`;
    if (!autoCreate) return "";
    send({ kind: "FOLDER_CREATE_BULK", payload: { id, name: "Auto", color: folderColor, count: Math.max(0, Math.min(20, sniperWallets)) } } as any);
    await new Promise(r => setTimeout(r, 400));
    setFolderId(id);
    return id;
  }

  function runDevPreset(p: DevPreset) {
    (async () => {
      const fid = await ensureFolderForRun(p.sniperWallets);
      if (!fid) return alert("Pick or auto-create a folder");
      if (!masterWallet) return alert("Authenticate master wallet first");
      const execMode = p.mode === "BUNDLED" ? "JITO_BUNDLE" : "RPC_SPRAY";
      send({ kind: "TASK_CREATE", payload: { kind: "SNIPE", ca: "", params: {
        walletFolderId: fid, walletCount: Math.max(0, Math.min(3, p.sniperWallets)),
        maxSolPerWallet: p.devBuySol, slippageBps: 500,
        execMode, jitterMs: [30,120], cuPrice: [800,1500], tipLamports: [0,0]
      } }, meta: { masterWallet } } as any);
      setOpen(null);
    })();
  }

  async function runFastSell() {
    if (!masterWallet) return alert("Authenticate master wallet first");
    const fid = folderId || await ensureFolderForRun(0);
    if (!fid) return alert("Pick a folder");
    const ca = await getLatestCA();
    if (!ca) return alert("No recent CA found");
    send({ kind: "TASK_CREATE", payload: { kind: "SELL", ca, params: {
      walletFolderId: fid, walletCount: 20, percent: 100, slippageBps: 300,
      execMode: "RPC_SPRAY", jitterMs: [50,150], cuPrice: [800,1400]
    } }, meta: { masterWallet } } as any);
    setOpen(null);
  }

  async function runSellLadder() {
    if (!masterWallet) return alert("Authenticate master wallet first");
    const fid = folderId || await ensureFolderForRun(0);
    if (!fid) return alert("Pick a folder");
    const ca = await getLatestCA();
    if (!ca) return alert("No recent CA found");
    const steps = [25, 50, 100];
    steps.forEach((pct, idx) => {
      setTimeout(() => {
        send({ kind: "TASK_CREATE", payload: { kind: "SELL", ca, params: {
          walletFolderId: fid, walletCount: 20, percent: pct, slippageBps: 300,
          execMode: "RPC_SPRAY", jitterMs: [50,150], cuPrice: [800,1400]
        } }, meta: { masterWallet } } as any);
      }, idx * 1500);
    });
    setOpen(null);
  }

  function requestReturnSol() {
    if (!folderId) return alert("Pick a folder");
    if (!masterWallet) return alert("Authenticate master wallet first");
    send({ kind: "FOLDER_SOL_SWEEP", payload: { id: folderId, masterPubkey: masterWallet } } as any);
    setOpen(null);
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={()=>setOpen(open==="folders"?null:"folders")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700">Folders</button>
      <button onClick={()=>setOpen(open==="presets"?null:"presets")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700">Presets</button>
      <button onClick={()=>setOpen(open==="fastsell"?null:"fastsell")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700">Fast Sell</button>
      <button onClick={()=>setOpen(open==="returnsol"?null:"returnsol")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700">Return SOL</button>

      {open && (
        <div style={{ position: "fixed", right: 16, top: 48, zIndex: 1100, background: "#111113", border: "1px solid #27272a", borderRadius: 12, padding: 12, minWidth: 360 }}>
          {open !== "presets" && (
            <div className="grid gap-2 mb-3">
              <label className="text-xs text-zinc-400">Folder</label>
              <select value={folderId} onChange={e=>setFolderId(e.target.value)} className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700">
                <option value="">Select…</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name} ({f.count})</option>)}
              </select>
            </div>
          )}

          {open === "presets" && (
            <div className="grid gap-4">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-medium mb-2">Dev Preset</div>
                <div className="grid gap-2">
                  <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" placeholder="Preset Name" onChange={e=>saveDevPreset({ name: e.target.value||"Default Dev", devBuySol: 0.1, sniperWallets: 1, mode: "STANDARD" })} />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1"><label className="text-xs text-zinc-400">Dev Buy (SOL)</label><input type="number" step="0.001" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" onChange={e=>{
                      const v = Math.max(0, Number(e.target.value || 0));
                      const name = (document.querySelector('input[placeholder="Preset Name"]') as HTMLInputElement)?.value || "Default Dev";
                      const cur = presets.dev.find(d=>d.name===name) || { name, devBuySol: 0.1, sniperWallets: 1, mode: "STANDARD" as const };
                      saveDevPreset({ ...cur, devBuySol: v });
                    }} /></div>
                    <div className="grid gap-1"><label className="text-xs text-zinc-400">Sniper Wallets (0–3)</label><input type="number" min={0} max={3} className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" onChange={e=>{
                      const v = Math.max(0, Math.min(3, Number(e.target.value || 0)));
                      const name = (document.querySelector('input[placeholder="Preset Name"]') as HTMLInputElement)?.value || "Default Dev";
                      const cur = presets.dev.find(d=>d.name===name) || { name, devBuySol: 0.1, sniperWallets: 1, mode: "STANDARD" as const };
                      saveDevPreset({ ...cur, sniperWallets: v });
                    }} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-zinc-400 flex items-center gap-2"><input type="checkbox" checked={autoCreate} onChange={e=>setAutoCreate(e.target.checked)} /> Auto-create folder</label>
                    <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={folderColor} onChange={e=>setFolderColor(e.target.value)} placeholder="#hex color" />
                  </div>
                  {/* Quick run buttons for saved presets */}
                  <div className="flex flex-wrap gap-2">
                    {presets.dev.map(p => (<button key={p.name} onClick={()=>runDevPreset(p)} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">{p.name}: Run</button>))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-medium mb-2">Volume Preset</div>
                <div className="grid gap-2">
                  <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" placeholder="Preset Name" onChange={e=>saveVolumePreset({ name: e.target.value||"Default Volume", buyPctMin: 0.5, buyPctMax: 5, delayMin: 10, delayMax: 60, tradesMin: 5, tradesMax: 20, tokenCount: 1 })} />
                </div>
              </div>
            </div>
          )}

          {open === "fastsell" && (
            <div className="grid gap-3">
              <div className="text-sm text-zinc-300">Sell 100% of the latest CA across this folder.</div>
              <div className="flex gap-2">
                <button onClick={runFastSell} className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500">Sell All</button>
                <button onClick={runSellLadder} className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500">Sell Ladder 25/50/100</button>
              </div>
            </div>
          )}

          {open === "returnsol" && (
            <div className="grid gap-3">
              <div className="text-sm text-zinc-300">Sweep SOL from all wallets in this folder back to the master wallet.</div>
              <button onClick={requestReturnSol} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Return SOL</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



