'use client';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';

type Row = {
  wallet: string;
  sol: number;
  token: number;
  est: number;
  status?: string;
};

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

export default function KeymakerPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [buySol, setBuySol] = useState(0.01);
  const [sellPct, setSellPct] = useState(50);
  const [slippageBps, setSlippageBps] = useState(150);
  const [turbo, setTurbo] = useState(false);

  const { data: groups } = useSWR('/api/groups', fetcher);
  const group = groups?.groups?.[0];

  const rows: Row[] = useMemo(() => {
    const wallets: string[] = group?.executionWallets || [];
    return wallets.map((w) => ({ wallet: w, sol: 0, token: 0, est: 0 }));
  }, [group]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        const w = rows[idx]?.wallet;
        if (w) setSelected((s) => ({ ...s, [w]: !s[w] }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rows]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Keymaker</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 flex items-end gap-3">
        <div>
          <label className="text-xs text-zinc-400">Buy (SOL)</label>
          <input
            type="number"
            min={0}
            step="0.001"
            value={buySol}
            onChange={(e) => setBuySol(Number(e.target.value))}
            className="input bg-zinc-900 w-32"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Sell (%)</label>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={sellPct}
            onChange={(e) => setSellPct(Number(e.target.value))}
            className="input bg-zinc-900 w-24"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Slippage (bps)</label>
          <input
            type="number"
            min={1}
            max={10000}
            step={1}
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            className="input bg-zinc-900 w-28"
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="turbo" type="checkbox" checked={turbo} onChange={(e) => setTurbo(e.target.checked)} />
          <label htmlFor="turbo" className="text-xs text-zinc-400">
            Turbo (Jito)
          </label>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-zinc-800 text-sm">Simulate</button>
          <button className="px-3 py-1.5 rounded-lg bg-[--primary] text-[--primary-foreground] hover:bg-[--primary-hover] active:bg-[--primary-active] text-sm">
            Send Live
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-950/60">
            <tr className="text-left">
              <th className="px-3 py-2">Pick</th>
              <th className="px-3 py-2">Wallet</th>
              <th className="px-3 py-2">SOL</th>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2">Est. Value</th>
              <th className="px-3 py-2">BUY (SOL)</th>
              <th className="px-3 py-2">SELL (%)</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.wallet} className="border-t border-zinc-800/70">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!selected[r.wallet]}
                    onChange={() => setSelected((s) => ({ ...s, [r.wallet]: !s[r.wallet] }))}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {r.wallet.slice(0, 4)}…{r.wallet.slice(-4)}
                </td>
                <td className="px-3 py-2">{r.sol.toFixed(4)}</td>
                <td className="px-3 py-2">{r.token.toFixed(2)}</td>
                <td className="px-3 py-2">{r.est.toFixed(4)} SOL</td>
                <td className="px-3 py-2">
                  <input type="number" className="input bg-zinc-900 w-28" defaultValue={buySol} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" className="input bg-zinc-900 w-24" defaultValue={sellPct} />
                </td>
                <td className="px-3 py-2 text-zinc-400">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
