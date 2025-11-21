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
    const slippageBps = Number(prompt("Slippage bps (e.g. 300 = 3%):") || "300");
    if (!ca) return;
    if (!folderId) { alert("Pick a folder first"); return; }
    if (!masterWallet) { alert("Connect wallet first"); return; }
    // Use daemon MARKET_ORDER for 100% sell across folder wallets
    send({ kind: "MARKET_ORDER", payload: {
      ca,
      side: "SELL",
      folderId,
      percentTokens: 100,
      slippageBps
    }} as any);
    pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "task", title: "Fast Sell", body: `CA ${ca} • folder ${folderId}`, severity: "info" });
    setOpen(false);
  }

  function returnSol() {
    if (!folderId) { alert("Pick a folder first"); return; }
    if (!masterWallet) { alert("Connect wallet first"); return; }
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