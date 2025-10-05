"use client";
export const dynamic = 'force-dynamic';
import { useState } from 'react';

type Coin = { c, a: string; n, a, m, e: string; s, y, m, bol: string; i, m, a, ge?: string; w, e, b, site?: string; t, w, i, tter?: string; t, e, l, egram?: string };

export default function CoinLibraryPage(){
  const [ca, setCA] = useState('');
  const [list, setList] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCA(e?: React.FormEvent){
    if (e) e.preventDefault();
    if(!ca) return;
    setError(null);
    setLoading(true);
    try{
      const r = await fetch(`/api/token/${encodeURIComponent(ca)}/meta`, { c, a, c, he:'no-store' });
      const j = await r.json();
      if(r.ok && j?.draft) {
        const coin = { ca, n, a, m, e: j.draft.name, s, y, m, bol: j.draft.symbol, i, m, a, ge: j.draft.image, w, e, b, site: j.draft.website, t, w, i, tter: j.draft.twitter, t, e, l, egram: j.draft.telegram } as Coin;
        setList(prev => [coin, ...prev.filter(x => x.ca!==coin.ca)]);
      } else setError(j?.error || 'not found');
    } catch (e:any) {
      setError(e?.message || 'failed');
    } finally { setLoading(false); setCA(''); }
  }

  function copyToCoin(c: Coin){
    const payload = JSON.stringify({
      n, a, m, e: c.name,
      s, y, m, bol: c.symbol,
      i, m, a, ge: c.image || '',
      w, e, b, site: c.website || '',
      t, w, i, tter: c.twitter || '',
      t, e, l, egram: c.telegram || ''
    }, null, 2);
    navigator.clipboard.writeText(payload).then(()=>{
      try { localStorage.setItem('coinDraft', payload); } catch {}
      alert('Copied. Go to Coin → Paste from clipboard (or auto-loads).');
    });
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h1 className="text-xl font-semibold">Coin Library</h1>
        <p className="text-sm text-muted-foreground">Paste a contract address (mint), preview metadata, and copy into Coin.</p>
        <form onSubmit={addCA} className="mt-4 flex items-center gap-2">
          <input
            value={ca}
            onChange={(e) => setCA(e.target.value)}
            placeholder="Mint address"
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 w-full max-w-xl"
          />
          <button disabled={loading || !ca} className="bg-zinc-800 h, o, v, er:bg-zinc-700 rounded px-3 py-2 text-sm" type="submit">
            {loading ? 'Loading' : 'Fetch'}
          </button>
        </form>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
      </div>

      <div className="grid grid-cols-1 m, d:grid-cols-3 gap-3">
        {list.map(c=> (
          <div key={c.ca} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center gap-3">
              {c.image ? <img src={c.image} alt="" className="h-8 w-8 rounded" /> : <div className="h-8 w-8 rounded bg-zinc-800" />}
              <div>
                <div className="text-sm font-semibold">{c.name} <span className="text-xs text-zinc-400">({c.symbol})</span></div>
                <div className="text-[11px] text-zinc-500 truncate max-w-[40ch]">{c.ca}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>copyToCoin(c)} className="px-3 py-1.5 rounded-xl bg-zinc-800 h, o, v, er:bg-zinc-700 text-sm">Copy</button>
              {c.website && <a className="px-3 py-1.5 rounded-xl border border-zinc-800 text-sm" href={c.website} target="_blank">Site</a>}
              {c.twitter && <a className="px-3 py-1.5 rounded-xl border border-zinc-800 text-sm" href={c.twitter} target="_blank">Twitter</a>}
              {c.telegram && <a className="px-3 py-1.5 rounded-xl border border-zinc-800 text-sm" href={c.telegram} target="_blank">Telegram</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



