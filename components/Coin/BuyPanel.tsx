'use client';
import { useEffect, useMemo, useState } from 'react';

type Group = { id: string; name: string };

export default function BuyPanel({
  mint,
  groupId: groupIdProp,
  onGroupIdChange,
}: {
  mint: string;
  groupId?: string;
  onGroupIdChange?: (id: string) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>(groupIdProp || '');
  const [amountSol, setAmountSol] = useState<number>(0.1);
  const [slippageBps, setSlippageBps] = useState<number>(150);
  const [priorityFee, setPriorityFee] = useState<number>(0);
  const [tipLamports, setTipLamports] = useState<number>(5000);
  const [region, setRegion] = useState<'ny' | 'ams' | 'ffm' | 'tokyo'>('ffm');
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState<'rpc' | 'jito' | null>(null);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    setGroupId(groupIdProp || '');
  }, [groupIdProp]);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/groups', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (abort) return;
        const gs: Group[] = (j.groups || []).map((g: any) => ({ id: g.id, name: g.name }));
        setGroups(gs);
        if (!groupId && gs.length) {
          setGroupId(gs[0].id);
          onGroupIdChange?.(gs[0].id);
        }
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, []);

  const canBuy = useMemo(
    () => mint && groupId && amountSol > 0 && slippageBps > 0,
    [mint, groupId, amountSol, slippageBps],
  );

  async function rpcBuy() {
    if (!canBuy) return;
    setBusy('rpc');
    setMsg('');
    try {
      const res = await fetch('/api/engine/rpc/buy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          groupId,
          mint,
          amountSol,
          slippageBps,
          priorityFeeMicrolamports: priorityFee || 0,
          dryRun,
        }),
      });
      const j = await res.json();
      if (!res.ok || j?.error) throw new Error(j?.error || 'RPC buy failed');
      setMsg(dryRun ? 'RPC buy simulated successfully.' : 'RPC buy submitted.');
    } catch (e: any) {
      setMsg(e?.message || 'RPC buy failed');
    }
    setBusy(null);
  }

  async function jitoBuy() {
    if (!canBuy) return;
    setBusy('jito');
    setMsg('');
    try {
      const res = await fetch('/api/engine/jito/buy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          groupId,
          mint,
          amountSol,
          slippageBps,
          tipLamports: tipLamports || undefined,
          region,
          dryRun,
          chunkSize: 5,
        }),
      });
      const j = await res.json();
      if (!res.ok || j?.error) throw new Error(j?.error || 'Jito buy failed');
      setMsg(dryRun ? 'Jito bundle simulated.' : 'Jito bundle submitted.');
    } catch (e: any) {
      setMsg(e?.message || 'Jito buy failed');
    }
    setBusy(null);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Group</label>
          <select
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              onGroupIdChange?.(e.target.value);
            }}
            className="input w-full bg-zinc-900"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Amount (SOL)</label>
          <input
            type="number"
            min={0.001}
            step={0.001}
            value={amountSol}
            onChange={(e) => setAmountSol(Number(e.target.value))}
            className="input w-full bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Slippage (bps)</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            className="input w-full bg-zinc-900"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />{' '}
            Dry-run
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400 mb-2">RPC Buy</div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-zinc-400">Priority fee (microlamports)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={priorityFee}
                onChange={(e) => setPriorityFee(Number(e.target.value))}
                className="input w-full bg-zinc-900"
              />
            </div>
            <button
              disabled={!canBuy || busy === 'rpc'}
              onClick={rpcBuy}
              className="button bg-blue-700 hover:bg-blue-600 px-3 py-2 disabled:opacity-60"
            >
              {busy === 'rpc' ? 'Sending' : 'RPC Buy'}
            </button>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Sends individual transactions to each wallet. Good for reliability; slightly slower.
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400 mb-2">Turbo Buy (1‑tx tip)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-xs text-zinc-400">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="input w-full bg-zinc-900"
              >
                <option value="ffm">Frankfurt</option>
                <option value="ams">Amsterdam</option>
                <option value="ny">New York</option>
                <option value="tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400">Tip (lamports)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={tipLamports}
                onChange={(e) => setTipLamports(Number(e.target.value))}
                className="input w-full bg-zinc-900"
              />
            </div>
            <div className="flex items-end">
              <button
                disabled={!canBuy || busy === 'jito'}
                onClick={jitoBuy}
                className="button bg-green-700 hover:bg-green-600 px-3 py-2 w-full disabled:opacity-60"
              >
                {busy === 'jito' ? 'Bundling' : 'Turbo Buy'}
              </button>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Submits a bundle to the Jito block engine. Faster/atomic; requires a tip.
          </div>
        </div>
      </div>

      {msg ? (
        <div className={`text-sm ${/failed|error/i.test(msg) ? 'text-red-400' : 'text-green-400'}`}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
