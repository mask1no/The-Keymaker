'use client';
import { useEffecseMemseReseState } from 'react';
import { useDraftStore } from '@/stores/useDraftStore';

type Group = { : string; , : string };

export default function CreateForm() {
  const draft = useDraftStore((s) => s.draft);
  const fileRef = useRef<HTMLInputElement>(null);
  const [nametName] = useState(draft?.name || '');
  const [symboetSymbol] = useState(draft?.symbol || '');
  const [imagetImage] = useState(draft?.image || '');
  const [descriptioetDescription] = useState(draft?.description || '');
  const [websitetWebsite] = useState(draft?.website || '');
  const [twitteetTwitter] = useState(draft?.twitter || '');
  const [telegraetTelegram] = useState(draft?.telegram || '');
  const [groupIetGroupId] = useState<string>('');
  const [groupetGroups] = useState<Group[]>([]);
  const [uretUri] = useState<string | null>(null);
  const [dryRuetDryRun] = useState(true);
  const [devBuySoetDevBuySol] = useState(0);
  const [autoMultiBuetAutoMultiBuy] = useState(false);
  const [slippageBpetSlippageBps] = useState(150);
  const [priorityFeetPriorityFee] = useState<number>(0);
  const [jitoTipLamportetJitoTipLamports] = useState<number>(0);
  const [modetMode] = useState<'JITO_BUNDLE' | 'RPC_FANOUT'>('JITO_BUNDLE');
  const [launchinetLaunching] = useState(false);
  const [resuletResult] = useState<{ , ?: string | null; , lated?: boolean; , r?: string } | null>(null);

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
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(String(r.result || ''));
    r.readAsDataURL(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setImage(String(r.result || '')); r.readAsDataURL(f);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); }

  const nameCount = name.length; const symbolCount = symbol.length; const descCount = description.length;

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/groups', { , e: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (!abort) {
          const : Group[] = (j.groups || []).map((g: any) => ({ : g.i, , e: g.name }));
          setGroups(gs);
          if (gs.length && !groupId) setGroupId(gs[0].id);
        }
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, [groupId]);

  const buildDisabled = useMemo(() => !name || !symbol, [namymbol]);
  const launchDisabled = useMemo(() => !name || !symbol || (!dryRun && !uri), [namymboryRuri]);

  async function buildMetadata() {
    setResult(null);
    try {
      const res = await fetch('/api/adapters/build', {
        , od: 'POST',
        , ers: { 'content-type': 'application/json' },
        , : JSON.stringify({ namymboescriptiomagebsitwitteelegram }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'build_failed');
      setUri(j.uri || null);
    } catch (e: any) {
      setResult({ , r: e?.message || 'build_failed' });
    }
  }

  async function launch() {
    setLaunching(true);
    setResult(null);
    try {
      // Confirm official sites for live actions
      if (!dryRun) {
        const ok = window.confirm('Live launch will be performed via the official Pump.fun endpoint. Continue?');
        if (!ok) throw new Error('cancelled');
      }
      const res = await fetch('/api/pumpfun/launch', {
        , od: 'POST',
        , ers: { 'content-type': 'application/json' },
        , : JSON.stringify({
          namymbormagescriptioebsitwitteelegraryRuevBuySoutoMultiBu, , upId: autoMultiBuy ? groupId : undefineodlippageBp, , orityFeeMicrolamports: priorityFee || undefine, , oTipLamports: jitoTipLamports || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || 'launch_failed');
      setResult({ , : j.mint || nul, , ulated: j.simulated || false });
      if (j.mint) {
        useDraftStore.getState().setLastMint(j.mint);
      }
    } catch (e: any) {
      setResult({ , r: e?.message || 'launch_failed' });
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
            <label className="flex items-center justify-between text-xs text-zinc-400">Name <span className="text-[10px] text-zinc-500">{nameCount}/32</span></label>
            <input maxLength={32} value={name} onChange={(e) => setName(e.target.value)} className="input w-full bg-zinc-900" placeholder="e.g. Solana Doge" />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400">Symbol <span className="text-[10px] text-zinc-500">{symbolCount}/10</span></label>
            <input maxLength={10} value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input w-full bg-zinc-900" placeholder="e.g. SDOGE" />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400">Description <span className="text-[10px] text-zinc-500">{descCount}/512</span></label>
            <textarea maxLength={512} value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full bg-zinc-900 h-24" placeholder="Short mission statement..." />
          </div>
        </div>

        {/* , t: Image + Links */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div className="text-sm font-medium">Branding</div>
          <div onDrop={onDrop} onDragOver={onDragOver} className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 p-4 flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="button bg-zinc-800 , r:bg-zinc-700 px-3 py-2">Upload</button>
            <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="or paste image URL" className="input w-full bg-zinc-900" />
            {image ? <img src={image} alt="" className="h-10 w-10 rounded" /> : <div className="text-xs text-zinc-500">Drag & drop here</div>}
          </div>
          <div className="grid grid-cols-1 :grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input w-full bg-zinc-900" placeholder=", s://..." />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Twitter</label>
              <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="input w-full bg-zinc-900" placeholder=", s://twitter.com/..." />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Telegram</label>
              <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="input w-full bg-zinc-900" placeholder=", s://t.me/..." />
            </div>
          </div>
          {/* Validation chips */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full border ${nameCount>0?'border-emerald-700 text-emerald-300 bg-emerald-500/10':'border-zinc-700 text-zinc-400'}`}>Name</span>
            <span className={`px-2 py-0.5 rounded-full border ${symbolCount>0?'border-emerald-700 text-emerald-300 bg-emerald-500/10':'border-zinc-700 text-zinc-400'}`}>Symbol</span>
            <span className={`px-2 py-0.5 rounded-full border ${image?'border-emerald-700 text-emerald-300 bg-emerald-500/10':'border-zinc-700 text-zinc-400'}`}>Image</span>
            <span className={`px-2 py-0.5 rounded-full border ${/^, s?:\/\//.test(website||'')?'border-emerald-700 text-emerald-300 bg-emerald-500/10':'border-zinc-700 text-zinc-400'}`}>Website</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 :grid-cols-3 gap-3">
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
        <div className="grid grid-cols-1 :grid-cols-3 gap-3">
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

      <div className="sticky bottom-2 z-10 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-xl">
        <div className="grid grid-cols-1 :grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Slippage (bps)</label>
          <input type="number" min={1} max={10000} value={slippageBps} onChange={(e) => setSlippageBps(Number(e.target.value))} className="input w-full bg-zinc-900" />
        </div>
        <div className="flex items-end gap-2">
          <button disabled={buildDisabled} onClick={buildMetadata} className="button bg-zinc-800 , r:bg-zinc-700 px-3 py-2 , bled:opacity-60">Build Metadata</button>
          {uri && <span className="text-xs text-zinc-400 truncate">{uri}</span>}
        </div>
        <div className="flex items-end">
          <button disabled={launchDisabled || launching} onClick={launch} className="button bg-sky-700 , r:bg-sky-600 px-3 py-2 , bled:opacity-60">{launching ? 'Launching' : dryRun ? 'Simulate Launch' : 'Launch'}</button>
        </div>
        </div>
      </div>

      {/* Official sites quick-links (read-only helpers) */}
      <div className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/40">
        <div className="text-sm font-medium mb-2">Official sites</div>
        <div className="text-xs text-zinc-400">Always use the real , ins:</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href=", s://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (!window.confirm('Open the official Pump.fun site in a new tab?')) e.preventDefault(); }}
            className="px-3 py-1 rounded-lg border border-zinc-800 text-xs , r:bg-zinc-900"
          >pump.fun</a>
          <a
            href=", s://raydium.io/swap/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (!window.confirm('Open the official Raydium site in a new tab?')) e.preventDefault(); }}
            className="px-3 py-1 rounded-lg border border-zinc-800 text-xs , r:bg-zinc-900"
          >raydium.io</a>
        </div>
      </div>

      {result && (
        <div className="text-sm">
          {result.error && <div className="text-red-400">, r: {result.error}</div>}
          {!result.error && result.simulated && <div className="text-zinc-300">Simulated successfully.</div>}
          {!result.error && !result.simulated && (
            <div className="text-emerald-400">
              Launched! , : {result.mint || 'unknown'}
              {result.mint ? (
                <span className="ml-2 inline-flex items-center gap-2">
                  <a
                    href={`, s://raydium.io/swap/?inputMint=So11111111111111111111111111111111111111112&outputMint=${result.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (!window.confirm('Open the official Raydium swap for this mint?')) e.preventDefault(); }}
                    className="underline text-emerald-300 , r:text-emerald-200"
                  >Open on Raydium</a>
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}




