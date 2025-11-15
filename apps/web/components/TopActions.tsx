"use client";
import { useEffect, useState } from "react";
import { useDaemonWS } from "@/lib/ws";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function TopActions() {
  const { send, onMessage } = useDaemonWS();
  const { masterWallet } = useApp();
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const router = useRouter();

  useEffect(() => {
    const off = onMessage((m: any) => { if (m.kind === "FOLDERS") setFolders(m.folders || []); });
    send({ kind: "FOLDER_LIST" } as any);
    return off;
  }, [onMessage, send]);

  function go(path: string) { router.push(path); }

  function requestReturnSol() {
    const fid = folderId || (folders[0]?.id || "");
    if (!fid) return alert("Pick a folder");
    if (!masterWallet) return alert("Authenticate master wallet first");
    send({ kind: "FOLDER_SOL_SWEEP", payload: { id: fid, masterPubkey: masterWallet } } as any);
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>go("/coin?tab=Coin")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm">Coin</button>
      <button onClick={()=>go("/coin?tab=Volume")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm">Volume</button>
      <button onClick={()=>go("/coin?tab=Buy")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm">Buy</button>
      <button onClick={()=>go("/coin?tab=Sell")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm">Sell</button>
      <div className="flex items-center gap-2">
        <select value={folderId} onChange={e=>setFolderId(e.target.value)} className="px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-sm">
          <option value="">Folder…</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name} ({f.count})</option>)}
        </select>
        <button onClick={requestReturnSol} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm">Return SOL</button>
      </div>
    </div>
  );
}