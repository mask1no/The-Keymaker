"use client";
import { useState } from "react";
import { useDaemonWS } from "@/lib/ws";
import type { ServerMsg } from "@keymaker/types";
import { useEffect } from "react";

export default function Coin() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState<6|9>(6);
  const [uri, setUri] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [metaUri, setMetaUri] = useState("");
  const [mint, setMint] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const [tab, setTab] = useState<"Coin"|"Volume"|"Buy"|"Sell"|"Comment">("Coin");
  // Shared params
  const [folderId, setFolderId] = useState("default");
  const [walletCount, setWalletCount] = useState(2);
  const [slippageBps, setSlippageBps] = useState(500);
  const [maxSolPerWallet, setMaxSolPerWallet] = useState(0.005);
  const [minOrderSol, setMinOrderSol] = useState(0.01);
  const [maxOrderSol, setMaxOrderSol] = useState(0.03);
  const [maxTxPerMin, setMaxTxPerMin] = useState(2);
  const [execMode, setExecMode] = useState<"RPC_SPRAY"|"STEALTH_STRETCH"|"JITO_LITE"|"JITO_BUNDLE">("RPC_SPRAY");
  const [jitter, setJitter] = useState<[number, number]>([50,150]);
  const { send, onMessage } = useDaemonWS();

  useEffect(() => {
    const off = onMessage((msg: ServerMsg) => {
      if ((msg as any).kind === "COIN_CREATED") {
        const m = msg as any;
        setMint(m.mint);
        push(`Created SPL token: ${m.mint}  sig=${m.sig}`);
      }
      if ((msg as any).kind === "COIN_PUBLISHED") {
        const m = msg as any;
        push(`Pump.fun published: ${m.mint}  sig=${m.sig}`);
      }
      if ((msg as any).kind === "ERR") push(`Error: ${(msg as any).error}`);
    });
    return off;
  }, [onMessage]);

  function push(s: string) { setLog(prev => [s, ...prev].slice(0,200)); }

  function createSpl() {
    const finalUri = metaUri || uri;
    if (!name || !symbol || !finalUri) return push("Fill name/symbol/URI");
    send({ kind: "COIN_CREATE_SPL", payload: { name, symbol, decimals, metadataUri: finalUri, payerFolderId: "default" } } as any);
  }
  function publishPump() {
    if (!mint) return push("No mint yet.");
    send({ kind: "COIN_PUBLISH_PUMPFUN", payload: { mint, payerFolderId: "default" } } as any);
  }

  async function uploadMetadata() {
    if (!imageUri || !uri) { push("Provide imageUri and metadataUri or both"); return; }
    send({ kind: "UPLOAD_METADATA", payload: { imageUri, metadataUri: uri } } as any);
  }

  return (
    <div className="p-6 grid gap-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["Coin","Volume","Buy","Sell","Comment"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm ${tab===t?"bg-[var(--accent)] text-white":"bg-zinc-800 text-zinc-200"}`}>{t}</button>
        ))}
      </div>

      {tab === "Coin" && (
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-zinc-800 shadow-card">
        <h2 className="text-xl font-semibold mb-3">Create SPL Memecoin</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">Name</label>
            <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">Symbol</label>
            <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={symbol} onChange={e=>setSymbol(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">Decimals</label>
            <select className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={decimals} onChange={e=>setDecimals(Number(e.target.value) as any)}>
              <option value={6}>6</option>
              <option value={9}>9</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">Metadata URI</label>
            <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" placeholder="https://.../metadata.json" value={uri} onChange={e=>setUri(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">Image URI (optional)</label>
            <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" placeholder="https://.../image.png" value={imageUri} onChange={e=>setImageUri(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-zinc-400">Result metadataUri</label>
            <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" placeholder="autofilled after upload" value={metaUri} onChange={e=>setMetaUri(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={createSpl} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">Create SPL</button>
          <button onClick={publishPump} className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600">Publish via pump.fun</button>
          <button onClick={uploadMetadata} className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600">Upload metadata</button>
        </div>
        {mint && <p className="mt-3 text-sm">Mint: <span className="font-mono break-all">{mint}</span></p>}
      </div>
      )}

      {tab === "Volume" && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-zinc-800 shadow-card">
          <h3 className="font-medium mb-3">Market Maker</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Folder</label><input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={folderId} onChange={e=>setFolderId(e.target.value)} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Wallets</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={walletCount} onChange={e=>setWalletCount(parseInt(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Exec</label><select className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={execMode} onChange={e=>setExecMode(e.target.value as any)}><option>RPC_SPRAY</option><option>STEALTH_STRETCH</option><option>JITO_LITE</option><option>JITO_BUNDLE</option></select></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Min SOL</label><input type="number" step="0.001" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={minOrderSol} onChange={e=>setMinOrderSol(parseFloat(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Max SOL</label><input type="number" step="0.001" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={maxOrderSol} onChange={e=>setMaxOrderSol(parseFloat(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Slippage</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={slippageBps} onChange={e=>setSlippageBps(parseInt(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Max tx/min</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={maxTxPerMin} onChange={e=>setMaxTxPerMin(parseInt(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Jitter (ms)</label><div className="flex gap-2"><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 w-full" value={jitter[0]} onChange={e=>setJitter([parseInt(e.target.value||"0"), jitter[1]])} /><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 w-full" value={jitter[1]} onChange={e=>setJitter([jitter[0], parseInt(e.target.value||"0")])} /></div></div>
          </div>
          <div className="mt-3">
            <button onClick={()=>{
              if (!mint) return push("No mint to run MM against. Create or paste CA in log.");
              const params = { walletFolderId: folderId, walletCount, minOrderSol, maxOrderSol, slippageBps, maxTxPerMin, execMode, jitterMs: jitter } as any;
              send({ kind: "TASK_CREATE", payload: { kind: "MM", ca: mint, params } } as any);
            }} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white">Start MM</button>
          </div>
        </div>
      )}

      {tab === "Buy" && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-zinc-800 shadow-card">
          <h3 className="font-medium mb-3">Quick Buy</h3>
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Folder</label><input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={folderId} onChange={e=>setFolderId(e.target.value)} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Wallets</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={walletCount} onChange={e=>setWalletCount(parseInt(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Max SOL/wallet</label><input type="number" step="0.001" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={maxSolPerWallet} onChange={e=>setMaxSolPerWallet(parseFloat(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Slippage</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={slippageBps} onChange={e=>setSlippageBps(parseInt(e.target.value||"0"))} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[25,50,75,100].map(p => (
              <button key={p} onClick={()=>{
                if (!mint) return push("No mint yet");
                const params = { execMode, jitterMs: jitter, tipLamports: [0,0] as [number,number], cuPrice: [0,0] as [number,number], walletFolderId: folderId, walletCount, maxSolPerWallet: (p/100)*maxSolPerWallet, slippageBps } as any;
                send({ kind: "TASK_CREATE", payload: { kind: "SNIPE", ca: mint, params } } as any);
              }} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm">BUY {p}%</button>
            ))}
          </div>
        </div>
      )}

      {tab === "Sell" && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-zinc-800 shadow-card">
          <h3 className="font-medium mb-3">Quick Sell</h3>
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Folder</label><input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={folderId} onChange={e=>setFolderId(e.target.value)} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Wallets</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={walletCount} onChange={e=>setWalletCount(parseInt(e.target.value||"0"))} /></div>
            <div className="grid gap-1"><label className="text-xs text-zinc-400">Slippage</label><input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={slippageBps} onChange={e=>setSlippageBps(parseInt(e.target.value||"0"))} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[25,50,75,100].map(p => (
              <button key={p} onClick={()=>{
                if (!mint) return push("No mint yet");
                const params = { execMode, jitterMs: jitter, tipLamports: [0,0] as [number,number], cuPrice: [0,0] as [number,number], walletFolderId: folderId, walletCount, percent: p, slippageBps } as any;
                send({ kind: "TASK_CREATE", payload: { kind: "SELL", ca: mint, params } } as any);
              }} className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-sm">SELL {p}%</button>
            ))}
          </div>
        </div>
      )}

      {tab === "Comment" && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-zinc-800 shadow-card text-sm text-muted">Placeholder</div>
      )}

      <div className="p-4 rounded-2xl bg-[var(--card)] border border-zinc-800 shadow-card">
        <h3 className="font-medium mb-2">Log</h3>
        <div className="text-xs font-mono grid gap-1 max-h-[300px] overflow-auto">
          {log.map((l,i)=> <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}


