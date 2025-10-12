'use client';
import { useState } from 'react';

export default function SellPanel({
  mint,
  groupId,
}: {
  mint: string;
  groupId: string;
}) {
  const [percent, setPercent] = useState<number>(50);
  const [atTime, setAtTime] = useState<string>('');
  const [busy, setBusy] = useState<null | 'all' | 'percent' | 'time'>(null);
  const [msg, setMsg] = useState<string>('');

  async function sellAll() {
    setBusy('all');
    setMsg('');
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/sell/all`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ groupId, mint, mode: 'RPC' }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) throw new Error(j?.error || 'Sell all failed');
      setMsg('Sell all submitted.');
    } catch (e: any) {
      setMsg(e?.message || 'Sell all failed');
    } finally {
      setBusy(null);
    }
  }

  async function sellPct() {
    setBusy('percent');
    setMsg('');
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/sell/percent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ groupId, mint, percent: Math.max(0, Math.min(100, percent)) }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) throw new Error(j?.error || 'Sell percent failed');
      setMsg(`Sell ${percent}% submitted.`);
    } catch (e: any) {
      setMsg(e?.message || 'Sell percent failed');
    } finally {
      setBusy(null);
    }
  }

  async function sellAtTime() {
    if (!atTime) return;
    setBusy('time');
    setMsg('');
    try {
      const ts = Date.parse(atTime);
      if (!Number.isFinite(ts)) throw new Error('Invalid time');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/sell/at-time`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ groupId, mint, at: ts, percent: 100 }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) throw new Error(j?.error || 'Schedule failed');
      setMsg(`Scheduled sell at ${new Date(ts).toLocaleString()}.`);
    } catch (e: any) {
      setMsg(e?.message || 'Schedule failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-4 space-y-3">
      <div className="text-sm font-medium">Sell</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <div className="text-xs text-zinc-400">Sell %</div>
          <div className="flex items-end gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="input w-full bg-zinc-900"
            />
            <button
              className="button bg-zinc-800 hover:bg-zinc-700 px-3 py-2"
              disabled={busy === 'percent'}
              onClick={sellPct}
            >
              {busy === 'percent' ? 'Sending' : 'Sell %'}
            </button>
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">Sell at Time</div>
          <div className="flex items-end gap-2">
            <input
              type="datetime-local"
              value={atTime}
              onChange={(e) => setAtTime(e.target.value)}
              className="input w-full bg-zinc-900"
            />
            <button
              className="button bg-zinc-800 hover:bg-zinc-700 px-3 py-2"
              disabled={busy === 'time'}
              onClick={sellAtTime}
            >
              {busy === 'time' ? 'Scheduling' : 'Schedule'}
            </button>
          </div>
        </div>
        <div className="flex items-end">
          <button
            className="button bg-red-700 hover:bg-red-600 px-3 py-2 w-full"
            disabled={busy === 'all'}
            onClick={sellAll}
          >
            {busy === 'all' ? 'Sending' : 'Sell All'}
          </button>
        </div>
      </div>
      {msg ? (
        <div className={`text-sm ${/failed|error/i.test(msg) ? 'text-red-400' : 'text-green-400'}`}>{msg}</div>
      ) : null}
    </div>
  );
}


