'use client';
import { useEffect, useMemo, useState } from 'react';

type Position = {
  wallet: string;
  mint: string;
  sizeTokens?: number;
  decimals?: number;
  uiAmount?: number;
};

export default function PositionsTable({ groupId, mint }: { groupId: string; mint: string }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [percent, setPercent] = useState(100);
  const [afterMs, setAfterMs] = useState(0);
  const [slippageBps, setSlippageBps] = useState(150);
  const [priorityFee, setPriorityFee] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasParams = useMemo(() => !!groupId && !!mint, [groupId, mint]);

  useEffect(() => {
    let abort = false;
    async function run() {
      if (!hasParams) {
        setPositions([]);
        return;
      }
      try {
        const url = `/api/positions?groupId=${encodeURIComponent(groupId)}&mint=${encodeURIComponent(mint)}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          setPositions([]);
          return;
        }
        const j = await res.json();
        if (abort) return;
        const ps = (j.positions || []) as Position[];
        setPositions(ps);
      } catch {
        if (!abort) setPositions([]);
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [groupId, mint, hasParams]);

  async function sellAll(p: Position) {
    await sell(p, 100, 0);
  }
  async function sellPct(p: Position) {
    await sell(p, percent, 0);
  }
  async function sellAfter(p: Position) {
    await sell(p, percent, afterMs);
  }

  async function sell(p: Position, pct: number, after: number) {
    setLoading(true);
    try {
      const res = await fetch('/api/engine/rpc/sell', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          groupId,
          mint: p.mint,
          percent: pct,
          afterMs: after || undefined,
          slippageBps,
          priorityFeeMicrolamports: priorityFee || undefined,
          dryRun: true,
          wallets: [p.wallet],
        }),
      });
      await res.json();
    } catch {}
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">Positions</div>
        <div className="flex items-center gap-2 text-xs">
          <label>Slippage</label>
          <input type="number" min={1} max={10000} value={slippageBps} onChange={(e) => setSlippageBps(Number(e.target.value))} className="input w-20 bg-zinc-900" />
          <label>PriorityFee (µLAM)</label>
          <input type="number" min={0} step={100} value={priorityFee} onChange={(e) => setPriorityFee(Number(e.target.value))} className="input w-28 bg-zinc-900" />
          <label>Sell %</label>
          <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="input w-16 bg-zinc-900" />
          <label>After (ms)</label>
          <input type="number" min={0} step={100} value={afterMs} onChange={(e) => setAfterMs(Number(e.target.value))} className="input w-24 bg-zinc-900" />
        </div>
      </div>
      <div className="space-y-2">
        {positions.length === 0 && <div className="text-xs text-zinc-500">No positions yet</div>}
        {positions.map((p) => (
          <div key={`${p.wallet}:${p.mint}`} className="flex items-center justify-between border border-zinc-800 rounded px-2 py-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono">{p.wallet.slice(0, 6)}…{p.wallet.slice(-6)}</span>
              <span className="text-zinc-400">{p.mint.slice(0, 4)}…{p.mint.slice(-4)}</span>
              {typeof p.uiAmount === 'number' && <span>{p.uiAmount} tokens</span>}
            </div>
            <div className="flex items-center gap-2">
              <button disabled={loading} onClick={() => sellAll(p)} className="button bg-zinc-800 hover:bg-zinc-700 px-2 py-1">Sell All</button>
              <button disabled={loading} onClick={() => sellPct(p)} className="button bg-zinc-800 hover:bg-zinc-700 px-2 py-1">Sell %</button>
              <button disabled={loading} onClick={() => sellAfter(p)} className="button bg-zinc-800 hover:bg-zinc-700 px-2 py-1">Sell after T</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


