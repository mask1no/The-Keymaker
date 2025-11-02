"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useDaemonWS } from "@/lib/ws";
import type { ServerMsg } from "@keymaker/types";

type ActivityItem =
  | { kind: "PUMP_EVENT"; ts: number; sig: string; slot: number }
  | { kind: "FILL"; ts: number; sig: string; side: "BUY"|"SELL"; wallet?: string; qty?: number; price?: number };

export default function MintCockpit() {
  const params = useParams<{ mint: string }>();
  const ca = useMemo(() => (params?.mint || "") as string, [params]);
  const { send, onMessage } = useDaemonWS();
  const [details, setDetails] = useState<{ ca: string; symbol?: string; name?: string; metadataUri?: string }>({ ca });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; state: string; created_at: number; updated_at: number }>>([]);
  const [folderId, setFolderId] = useState("default");
  const [walletCount, setWalletCount] = useState(2);
  const [slippageBps, setSlippageBps] = useState(500);
  const [maxSol, setMaxSol] = useState(0.005);
  const [sellPct, setSellPct] = useState(50);

  useEffect(() => {
    const off = onMessage((msg: ServerMsg | any) => {
      if ((msg as any).kind === "PUMP_EVENT" && (msg as any).ca === ca) {
        const item: ActivityItem = { kind: "PUMP_EVENT", ts: Date.now(), sig: String((msg as any).sig || ""), slot: Number((msg as any).slot || 0) };
        setActivity((a): ActivityItem[] => [item, ...a].slice(0, 500));
      }
      if ((msg as any).kind === "TASK_EVENT" && (msg as any).state === "FILL" && (msg as any).info?.ca === ca) {
        const info = (msg as any).info || {};
        const fill: ActivityItem = { kind: "FILL", ts: Date.now(), sig: String(info.sig || ""), side: (info.side || "BUY") as ("BUY"|"SELL"), wallet: info.wallet, qty: info.qty, price: info.price };
        setActivity((a): ActivityItem[] => [fill, ...a].slice(0, 500));
      }
      if ((msg as any).kind === "TASKS") {
        const items = (msg as any).items || [];
        const filtered = items.filter((t: any)=> t.ca === ca);
        setTasks(filtered);
      }
      if ((msg as any).kind === "TASK_EVENT") {
        const id = (msg as any).id as string;
        const st = (msg as any).state as string;
        setTasks((ts) => ts.map((t)=> t.id === id ? { ...t, state: st, updated_at: Date.now() } : t).filter((t)=> !(t.id === id && (st === "DONE" || st === "FAIL" || st === "ABORT"))));
      }
    });
    return off;
  }, [ca, onMessage]);

  useEffect(() => {
    // initial load of tasks for this CA
    send({ kind: "TASK_LIST", payload: { ca } } as any);
  }, [send, ca]);

  // Positions polling (wallet balances)
  const [positions, setPositions] = useState<Array<{ pubkey: string; solLamports: number; tokenUi: number; lastFillTs: number }>>([]);
  const [posErr, setPosErr] = useState<string | null>(null);
  useEffect(() => {
    let dead = false; let id: any;
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_WS_URL?.replace(/^ws/, "http") || "http://localhost:8787";
        const res = await fetch(`${base}/positions?ca=${encodeURIComponent(ca)}&folder=${encodeURIComponent(folderId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!dead) setPositions(j);
      } catch (e:any) { if (!dead) setPosErr(e.message); }
    }
    load(); id = setInterval(load, 4000);
    return () => { dead = true; clearInterval(id); };
  }, [ca, folderId]);

  function startSnipe(pct: number) {
    const params = {
      execMode: "RPC_SPRAY",
      jitterMs: [50, 150] as [number, number],
      tipLamports: [0, 0] as [number, number],
      cuPrice: [0, 0] as [number, number],
      walletFolderId: folderId,
      walletCount,
      maxSolPerWallet: (pct / 100) * maxSol,
      slippageBps
    } as any;
    send({ kind: "TASK_CREATE", payload: { kind: "SNIPE", ca, params } } as any);
  }

  function startSell(pct: number) {
    const params = {
      execMode: "RPC_SPRAY",
      jitterMs: [50, 150] as [number, number],
      tipLamports: [0, 0] as [number, number],
      cuPrice: [0, 0] as [number, number],
      walletFolderId: folderId,
      walletCount,
      percent: pct,
      slippageBps
    } as any;
    send({ kind: "TASK_CREATE", payload: { kind: "SELL", ca, params } } as any);
  }

  function killTasks() {
    // Kill all tasks for this CA
    const ids = tasks.map((t)=>t.id);
    for (const id of ids) send({ kind: "TASK_KILL", payload: { id } } as any);
  }

  return (
    <div className="p-6 grid gap-4">
      {/* Details */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <h2 className="text-lg font-semibold mb-2">Details</h2>
        <div className="text-sm text-zinc-300 break-all">CA: <span className="font-mono">{ca}</span></div>
        <div className="mt-2 flex gap-2">
          <a className="text-xs text-emerald-400 underline" target="_blank" href={`https://solscan.io/token/${encodeURIComponent(ca)}`}>Solscan</a>
          <a className="text-xs text-emerald-400 underline" target="_blank" href={`https://dexscreener.com/solana/${encodeURIComponent(ca)}`}>DexScreener</a>
        </div>
      </div>

      {/* Activity */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <h2 className="text-lg font-semibold mb-2">Activity</h2>
        <div className="grid gap-2 max-h-[360px] overflow-auto text-xs font-mono">
          {activity.map((it, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded ${it.kind === "FILL" ? "bg-emerald-700/40 text-emerald-200" : "bg-zinc-700/40 text-zinc-200"}`}>{it.kind}</span>
                {"sig" in it && it.sig ? <a className="text-emerald-400 underline" target="_blank" href={`https://solscan.io/tx/${it.sig}`}>{it.sig.slice(0, 12)}…</a> : <span>-</span>}
              </div>
              <div className="text-zinc-400">
                {it.kind === "FILL" ? (
                  <span>{it.side} qty={it.qty ?? 0} price={it.price ?? 0}</span>
                ) : (
                  <span>slot={"slot" in it ? it.slot : 0}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <h2 className="text-lg font-semibold mb-3">Tasks</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-zinc-400">Folder</label>
            <input className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={folderId} onChange={(e)=>setFolderId(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-zinc-400">Wallets</label>
            <input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={walletCount} onChange={(e)=>setWalletCount(parseInt(e.target.value||"0"))} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-zinc-400">Max SOL per wallet</label>
            <input type="number" step="0.001" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={maxSol} onChange={(e)=>setMaxSol(parseFloat(e.target.value||"0"))} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-zinc-400">Slippage (bps)</label>
            <input type="number" className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700" value={slippageBps} onChange={(e)=>setSlippageBps(parseInt(e.target.value||"0"))} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={()=>startSnipe(25)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm">Buy 25%</button>
          <button onClick={()=>startSnipe(50)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm">Buy 50%</button>
          <button onClick={()=>startSnipe(75)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm">Buy 75%</button>
          <button onClick={()=>startSnipe(100)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm">Buy 100%</button>
          <span className="mx-2 w-px h-6 bg-zinc-700" />
          <button onClick={()=>startSell(25)} className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-sm">Sell 25%</button>
          <button onClick={()=>startSell(50)} className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-sm">Sell 50%</button>
          <button onClick={()=>startSell(75)} className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-sm">Sell 75%</button>
          <button onClick={()=>startSell(100)} className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-sm">Sell All</button>
          <span className="mx-2 w-px h-6 bg-zinc-700" />
          <button onClick={killTasks} className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm">Kill Running</button>
        </div>
        <div className="mt-4">
          <h3 className="font-medium mb-2">Running tasks</h3>
          <div className="grid gap-2 text-xs">
            {tasks.length === 0 && <div className="text-zinc-400">No tasks.</div>}
            {tasks.map((t)=> (
              <div key={t.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-700/40 text-zinc-200">{t.state}</span>
                  <span className="font-mono text-zinc-300">{t.id.slice(0,8)}…</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>send({ kind: "TASK_KILL", payload: { id: t.id } } as any)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-800">Kill</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-medium mb-2">Positions</h3>
          {posErr && <div className="text-xs text-red-400">{posErr}</div>}
          <div className="grid gap-2 text-xs">
            {positions.length === 0 && <div className="text-zinc-400">No wallets or no balances.</div>}
            {positions.map((p)=> (
              <div key={p.pubkey} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
                <div className="font-mono text-zinc-300">{p.pubkey.slice(0,4)}…{p.pubkey.slice(-4)}</div>
                <div className="text-zinc-400">SOL: {(p.solLamports/1e9).toFixed(4)} • Token: {p.tokenUi.toFixed(4)} • Last: {p.lastFillTs? new Date(p.lastFillTs).toLocaleTimeString():"-"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


