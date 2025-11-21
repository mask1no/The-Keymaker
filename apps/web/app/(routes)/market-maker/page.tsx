"use client";
import { useState } from "react";
import { useDaemonWS } from "@/lib/ws";
import { useApp } from "@/lib/store";

export default function MarketMaker() {
  const { send } = useDaemonWS();
  const { masterWallet } = useApp();
  const [ca, setCa] = useState("");
  const [folderId, setFolderId] = useState("");
  const [walletCount, setWalletCount] = useState(5);
  const [amountSol, setAmountSol] = useState(0.05);
  const [slippageBps, setSlippageBps] = useState(300);
  const [tipLamports, setTipLamports] = useState(50_000);
  const [jMin, setJMin] = useState(10);
  const [jMax, setJMax] = useState(35);
  const [log, setLog] = useState<string[]>([]);
  const { onMessage } = useDaemonWS();

  function push(s: string) { setLog((prev)=> [s, ...prev].slice(0, 200)); }

  // Subscribe to task events for quick feedback
  React.useEffect(() => {
    const off = onMessage((m: any) => {
      if (m?.kind === "TASK_ACCEPTED") push(`Accepted task ${m.id}`);
      if (m?.kind === "TASK_EVENT") push(`Task ${m.id} → ${m.state}`);
      if (m?.kind === "FILL") push(`Fill ${m.sig || ""}`);
    });
    return off;
  }, [onMessage]);

  function bundle() {
    if (!ca || !folderId) return;
    const wc = Math.max(1, Math.min(20, Number(walletCount)));
    send({
      kind: "TASK_CREATE",
      payload: {
        kind: "SNIPE",
        ca,
        params: {
          walletFolderId: folderId,
          walletCount: wc,
          maxSolPerWallet: Number(amountSol),
          slippageBps: Number(slippageBps),
          execMode: "JITO_LITE",
          jitterMs: [Number(jMin), Number(jMax)],
          tipLamports: [Number(tipLamports), Number(tipLamports)],
        },
      },
      meta: { masterWallet },
    });
    push(`SNIPE started for ${ca} • folder ${folderId} • wallets ${wc}`);
  }

  return (
    <div className="grid gap-4 max-w-xl">
      <div className="text-2xl font-semibold">Bundle buys</div>
      <label className="grid gap-1">
        <span className="text-sm text-zinc-400">Contract (mint address)</span>
        <input value={ca} onChange={(e) => setCa(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" placeholder="CA..." />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-zinc-400">Folder ID</span>
        <input value={folderId} onChange={(e) => setFolderId(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" placeholder="folder id..." />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">Wallets (≤20)</span>
          <input type="number" min={1} max={20} value={walletCount} onChange={(e) => setWalletCount(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">SOL per wallet</span>
          <input type="number" step="0.001" value={amountSol} onChange={(e) => setAmountSol(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">Slippage (bps)</span>
          <input type="number" value={slippageBps} onChange={(e) => setSlippageBps(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">Priority tip (lamports, first tx)</span>
          <input type="number" value={tipLamports} onChange={(e) => setTipLamports(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">Jitter min (ms)</span>
          <input type="number" value={jMin} onChange={(e) => setJMin(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-zinc-400">Jitter max (ms)</span>
          <input type="number" value={jMax} onChange={(e) => setJMax(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900" />
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={bundle} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Bundle via Jito-lite</button>
        <a href="/wallets" className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-center">Manage wallets</a>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="text-sm text-zinc-400">Activity</div>
        <div className="text-xs font-mono border border-zinc-800 rounded-xl p-3 max-h-[240px] overflow-auto bg-zinc-950/60">
          {log.length === 0 ? <div className="text-zinc-500">No events yet.</div> : log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
