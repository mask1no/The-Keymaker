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
  const [mint, setMint] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
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
    if (!name || !symbol || !uri) return push("Fill name/symbol/URI");
    send({ kind: "COIN_CREATE_SPL", payload: { name, symbol, decimals, metadataUri: uri, payerFolderId: "default" } } as any);
  }
  function publishPump() {
    if (!mint) return push("No mint yet.");
    send({ kind: "COIN_PUBLISH_PUMPFUN", payload: { mint, payerFolderId: "default" } } as any);
  }

  return (
    <div className="p-6 grid gap-4">
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
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
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={createSpl} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">Create SPL</button>
          <button onClick={publishPump} className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600">Publish via pump.fun</button>
        </div>
        {mint && <p className="mt-3 text-sm">Mint: <span className="font-mono break-all">{mint}</span></p>}
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <h3 className="font-medium mb-2">Log</h3>
        <div className="text-xs font-mono grid gap-1 max-h-[300px] overflow-auto">
          {log.map((l,i)=> <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}


