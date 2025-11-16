"use client";
import { useState } from "react";
import { useDaemonWS } from "@/lib/ws";
import { useApp } from "@/lib/store";

export default function TopActions() {
  const { send } = useDaemonWS();
  const { pushNotif, masterWallet } = useApp();
  const [open, setOpen] = useState(false);
  const [folderId, setFolderId] = useState("");

  function fastSell() {
    const ca = prompt("Sell 100% by CA:");
    const count = Number(prompt("Wallets (1..20):") || "5");
    const slippageBps = Number(prompt("Slippage bps (e.g. 300 = 3%):") || "300");
    if (!ca || !folderId) return;
    send({ kind: "TASK_CREATE", payload: { kind: "SELL", ca, params: {
      walletFolderId: folderId, walletCount: count, percent: 100, slippageBps,
      execMode: "RPC_SPRAY", jitterMs: [50,150]
    }}, meta: { masterWallet } });
    pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "task", title: "Fast Sell", body: `CA ${ca}`, severity: "info" });
    setOpen(false);
  }

  function returnSol() {
    if (!folderId) return alert("Pick a folder first");
    send({ kind: "FOLDER_SOL_SWEEP", payload: { id: folderId, masterPubkey: masterWallet } } as any);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700">
        Actions ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl p-2">
          <div className="grid gap-2">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Folder</div>
              <input value={folderId} onChange={(e) => setFolderId(e.target.value)}
                     className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700"
                     placeholder="folder id" />
            </div>
            <button onClick={() => (location.href = "/wallets")} className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-xl">Folders</button>
            <button onClick={() => alert("Presets coming soon")} className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-xl">Presets</button>
            <button onClick={fastSell} className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-xl">Fast Sell</button>
            <button onClick={returnSol} className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-xl">Return SOL</button>
          </div>
        </div>
      )}
    </div>
  );
}