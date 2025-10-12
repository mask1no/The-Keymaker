'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDraftStore } from '@/stores/useDraftStore';

type Group = { id: string; name: string };

export default function CreateForm() {
  const draft = useDraftStore((s) => s.draft);
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [devBuySol, setDevBuySol] = useState(0);
  const [autoMultiBuy, setAutoMultiBuy] = useState(false);
  const [slippageBps, setSlippageBps] = useState(150);
  const [priorityFee, setPriorityFee] = useState<number>(0);
  const [jitoTipLamports, setJitoTipLamports] = useState<number>(0);
  const [mode, setMode] = useState<'RPC_FANOUT'>('RPC_FANOUT');
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<{
    mint?: string | null;
    simulated?: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setName(draft?.name || '');
    setSymbol(draft?.symbol || '');
    setImage(draft?.image || '');
    setDescription(draft?.description || '');
    setWebsite(draft?.website || '');
    setTwitter(draft?.twitter || '');
    setTelegram(draft?.telegram || '');
  }, [draft]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(String(r.result || ''));
    r.readAsDataURL(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(String(r.result || ''));
    r.readAsDataURL(f);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  const nameCount = name.length;
  const symbolCount = symbol.length;
  const descCount = description.length;

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/wallets/list`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) return;
        const j = await res.json();
        if (!abort) {
          const gs: Group[] = (j.groups || j || []).map((g: any) => ({ id: g.id, name: g.name }));
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
  const launchDisabled = useMemo(() => !name || !symbol || !uri, [name, symbol, uri]);

  async function buildMetadata() {
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/health`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, symbol, description, image, website, twitter, telegram }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'build_failed');
      setUri('ipfs://placeholder');
    } catch (e: any) {
      setResult({ error: e?.message || 'build_failed' });
    }
  }

  async function launch() {
    setLaunching(true);
    setResult(null);
    try {
      // Confirm live launch
      const ok = window.confirm(
        'Launch will be performed via the official Pump.fun endpoint. Continue?',
      );
      if (!ok) throw new Error('cancelled');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/engine/bundle`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actions: ['CREATE'], name, symbol, supply: 10 ** 15 }),
      });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || 'launch_failed');
      setResult({ mint: j.mint || null, simulated: false });
    } catch (e: any) {
      setResult({ error: e?.message || 'launch_failed' });
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 :grid-cols-2 gap-4">
        {/* , : Info Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div className="text-sm font-medium">Token Info</div>
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400">
              Name <span className="text-[10px] text-zinc-500">{nameCount}/32</span>
            </label>
            <input
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full bg-zinc-900"
              placeholder="e.g. Solana Doge"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400">
              Symbol <span className="text-[10px] text-zinc-500">{symbolCount}/10</span>
            </label>
            <input
              maxLength={10}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="input w-full bg-zinc-900"
              placeholder="e.g. SDOGE"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400">
              Description <span className="text-[10px] text-zinc-500">{descCount}/512</span>
            </label>
            <textarea
              maxLength={512}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full bg-zinc-900 h-24"
              placeholder="Short mission statement"
            />
          </div>
        </div>

        {/* , t: Image + Links */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div className="text-sm font-medium">Branding</div>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 p-4 flex items-center gap-3"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="button bg-zinc-800 hover:bg-zinc-700 px-3 py-2"
            >
              Upload
            </button>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="or paste image URL"
              className="input w-full bg-zinc-900"
            />
            {image ? (
              <img src={image} alt="" className="h-10 w-10 rounded" />
            ) : (
              <div className="text-xs text-zinc-500">Drag & drop here</div>
            )}
          </div>
          <div className="grid grid-cols-1 :grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input w-full bg-zinc-900"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Twitter</label>
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="input w-full bg-zinc-900"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Telegram</label>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="input w-full bg-zinc-900"
                placeholder="https://t.me/yourchannel"
              />
            </div>
          </div>
          {/* Validation chips */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span
              className={`px-2 py-0.5 rounded-full border ${nameCount > 0 ? 'border-green-700 text-green-300 bg-green-500/10' : 'border-zinc-700 text-zinc-400'}`}
            >
              Name
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border ${symbolCount > 0 ? 'border-green-700 text-green-300 bg-green-500/10' : 'border-zinc-700 text-zinc-400'}`}
            >
              Symbol
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border ${image ? 'border-green-700 text-green-300 bg-green-500/10' : 'border-zinc-700 text-zinc-400'}`}
            >
              Image
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border ${/^https?:\/\//.test(website || '') ? 'border-green-700 text-green-300 bg-green-500/10' : 'border-zinc-700 text-zinc-400'}`}
            >
              Website
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 :grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <input
            id="auto"
            type="checkbox"
            checked={autoMultiBuy}
            onChange={(e) => setAutoMultiBuy(e.target.checked)}
          />
          <label htmlFor="auto" className="text-sm">
            Auto multi-buy after launch
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="input bg-zinc-900"
          >
            <option value="RPC_FANOUT">RPC_FANOUT</option>
          </select>
        </div>
      </div>

      {autoMultiBuy && (
        <div className="grid grid-cols-1 :grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
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
            <label className="text-xs text-zinc-400">Dev Buy (SOL)</label>
            <input
              type="number"
              min={0}
              step="0.001"
              value={devBuySol}
              onChange={(e) => setDevBuySol(Number(e.target.value))}
              className="input w-full bg-zinc-900"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Priority Fee (microlamports)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={priorityFee}
              onChange={(e) => setPriorityFee(Number(e.target.value))}
              className="input w-full bg-zinc-900"
            />
          </div>
        </div>
      )}

      <div className="sticky bottom-2 z-10 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-xl">
        <div className="grid grid-cols-1 :grid-cols-3 gap-3">
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
            <button
              disabled={buildDisabled}
              onClick={buildMetadata}
              className="button bg-zinc-800 hover:bg-zinc-700 px-3 py-2 disabled:opacity-60"
            >
              Build Metadata
            </button>
            {uri && <span className="text-xs text-zinc-400 truncate">{uri}</span>}
          </div>
          <div className="flex items-end">
            <button
              disabled={launchDisabled || launching}
              onClick={launch}
              className="button bg-green-600 hover:bg-green-500 px-3 py-2 disabled:opacity-60"
            >
              {launching ? 'Launching' : 'Launch'}
            </button>
          </div>
        </div>
      </div>

      {/* Official sites quick-links (read-only helpers) */}
      <div className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/40">
        <div className="text-sm font-medium mb-2">Official sites</div>
        <div className="text-xs text-zinc-400">Always use the real links:</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!window.confirm('Open the official Pump.fun site in a new tab?'))
                e.preventDefault();
            }}
            className="px-3 py-1 rounded-lg border border-zinc-800 text-xs hover:bg-zinc-900"
          >
            pump.fun
          </a>
          {/* Raydium deprecated */}
        </div>
      </div>

      {result && (
        <div className="text-sm">
          {result.error && <div className="text-red-400">, r: {result.error}</div>}
          {!result.error && (
            <div className="text-green-400">
              Launched! : {result.mint || 'unknown'}
              {result.mint ? (
                <span className="ml-2 inline-flex items-center gap-2">
                  {/* Raydium swap link removed; post-migration routes via Jupiter */}
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
