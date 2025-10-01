'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDraftStore } from '@/stores/useDraftStore';

type Group = { id: string; name: string };

export default function CreateForm() {
  const draft = useDraftStore((s) => s.draft);
  const [name, setName] = useState(draft?.name || '');
  const [symbol, setSymbol] = useState(draft?.symbol || '');
  const [image, setImage] = useState(draft?.image || '');
  const [description, setDescription] = useState(draft?.description || '');
  const [website, setWebsite] = useState(draft?.website || '');
  const [twitter, setTwitter] = useState(draft?.twitter || '');
  const [telegram, setTelegram] = useState(draft?.telegram || '');
  const [groupId, setGroupId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [uri, setUri] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [devBuySol, setDevBuySol] = useState(0);
  const [autoMultiBuy, setAutoMultiBuy] = useState(false);
  const [slippageBps, setSlippageBps] = useState(150);
  const [priorityFee, setPriorityFee] = useState<number>(0);
  const [jitoTipLamports, setJitoTipLamports] = useState<number>(0);
  const [mode, setMode] = useState<'JITO_BUNDLE' | 'RPC_FANOUT'>('JITO_BUNDLE');
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<{ mint?: string | null; simulated?: boolean; error?: string } | null>(null);

  useEffect(() => {
    setName(draft?.name || '');
    setSymbol(draft?.symbol || '');
    setImage(draft?.image || '');
    setDescription(draft?.description || '');
    setWebsite(draft?.website || '');
    setTwitter(draft?.twitter || '');
    setTelegram(draft?.telegram || '');
  }, [draft]);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/groups', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (!abort) {
          const gs: Group[] = (j.groups || []).map((g: any) => ({ id: g.id, name: g.name }));
          setGroups(gs);
          if (gs.length && !groupId) setGroupId(gs[0].id);
        }
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, [groupId]);

  const buildDisabled = useMemo(() => !name || !symbol, [name, symbol]);
  const launchDisabled = useMemo(() => !name || !symbol || (!dryRun && !uri), [name, symbol, dryRun, uri]);

  async function buildMetadata() {
    setResult(null);
    try {
      const res = await fetch('/api/adapters/build', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, symbol, description, image, website, twitter, telegram }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'build_failed');
      setUri(j.uri || null);
    } catch (e: any) {
      setResult({ error: e?.message || 'build_failed' });
    }
  }

  async function launch() {
    setLaunching(true);
    setResult(null);
    try {
      const res = await fetch('/api/pumpfun/launch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          symbol,
          uri,
          image,
          description,
          website,
          twitter,
          telegram,
          dryRun,
          devBuySol,
          autoMultiBuy,
          groupId: autoMultiBuy ? groupId : undefined,
          mode,
          slippageBps,
          priorityFeeMicrolamports: priorityFee || undefined,
          jitoTipLamports: jitoTipLamports || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || 'launch_failed');
      setResult({ mint: j.mint || null, simulated: j.simulated || false });
    } catch (e: any) {
      setResult({ error: e?.message || 'launch_failed' });
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full bg-zinc-900" />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input w-full bg-zinc-900" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400">Image URL</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} className="input w-full bg-zinc-900" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full bg-zinc-900 h-20" />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input w-full bg-zinc-900" />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Twitter</label>
          <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="input w-full bg-zinc-900" />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Telegram</label>
          <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="input w-full bg-zinc-900" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <input id="dry" type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          <label htmlFor="dry" className="text-sm">Simulate before send (dry-run)</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="auto" type="checkbox" checked={autoMultiBuy} onChange={(e) => setAutoMultiBuy(e.target.checked)} />
          <label htmlFor="auto" className="text-sm">Auto multi-buy after launch</label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="input bg-zinc-900">
            <option value="JITO_BUNDLE">JITO_BUNDLE</option>
            <option value="RPC_FANOUT">RPC_FANOUT</option>
          </select>
        </div>
      </div>

      {autoMultiBuy && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Group</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="input w-full bg-zinc-900">
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Dev Buy (SOL)</label>
            <input type="number" min={0} step="0.001" value={devBuySol} onChange={(e) => setDevBuySol(Number(e.target.value))} className="input w-full bg-zinc-900" />
          </div>
          {mode === 'RPC_FANOUT' ? (
            <div>
              <label className="text-xs text-zinc-400">Priority Fee (microlamports)</label>
              <input type="number" min={0} step={100} value={priorityFee} onChange={(e) => setPriorityFee(Number(e.target.value))} className="input w-full bg-zinc-900" />
            </div>
          ) : (
            <div>
              <label className="text-xs text-zinc-400">Jito Tip (lamports)</label>
              <input type="number" min={0} step={1000} value={jitoTipLamports} onChange={(e) => setJitoTipLamports(Number(e.target.value))} className="input w-full bg-zinc-900" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Slippage (bps)</label>
          <input type="number" min={1} max={10000} value={slippageBps} onChange={(e) => setSlippageBps(Number(e.target.value))} className="input w-full bg-zinc-900" />
        </div>
        <div className="flex items-end gap-2">
          <button disabled={buildDisabled} onClick={buildMetadata} className="button bg-zinc-800 hover:bg-zinc-700 px-3 py-2 disabled:opacity-60">Build Metadata</button>
          {uri && <span className="text-xs text-zinc-400 truncate">{uri}</span>}
        </div>
        <div className="flex items-end">
          <button disabled={launchDisabled || launching} onClick={launch} className="button bg-sky-700 hover:bg-sky-600 px-3 py-2 disabled:opacity-60">{launching ? 'Launching…' : dryRun ? 'Simulate Launch' : 'Launch'}</button>
        </div>
      </div>

      {result && (
        <div className="text-sm">
          {result.error && <div className="text-red-400">Error: {result.error}</div>}
          {!result.error && result.simulated && <div className="text-zinc-300">Simulated successfully.</div>}
          {!result.error && !result.simulated && <div className="text-emerald-400">Launched! Mint: {result.mint || 'unknown'}</div>}
        </div>
      )}
    </div>
  );
}


