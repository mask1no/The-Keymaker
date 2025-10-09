'use client';
import { useEffect, useState } from 'react';

type WalletGroup = { id: string; name: string; masterWallet?: string|null; devWallet?: string|null; sniperWallets: string[]; executionWallets: string[] };

export default function WalletGroupPage({ params }: { params: { id: string } }){
  const id = params.id;
  const [group, setGroup] = useState<WalletGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importKey, setImportKey] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch('/api/groups', { cache: 'no-store' });
        if (!r.ok) throw new Error('failed');
        const j = await r.json();
        const g = (j.groups || []).find((x: any) => x.id === id) || null;
        if (!cancel) setGroup(g);
      } catch (e: any) { if (!cancel) setError(e?.message || 'failed'); }
    })();
    return () => { cancel = true; };
  }, [id]);

  if (error) return <div className="p-6 text-sm text-red-400">{error}</div>;
  if (!group) return <div className="p-6 text-sm">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="text-xs text-zinc-400">Wallet Group</div>
      <h1 className="text-xl font-semibold">{group.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="text-sm font-semibold mb-2">Overview</div>
          <div className="text-xs text-zinc-400">Master: {group.masterWallet || 'unset'}</div>
          <div className="text-xs text-zinc-400">Dev: {group.devWallet || 'unset'}</div>
          <div className="text-xs text-zinc-400">Snipers: {group.sniperWallets.length}</div>
          <div className="text-xs text-zinc-400">Execution: {group.executionWallets.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="text-sm font-semibold mb-2">Wallets</div>
          <div className="text-xs text-zinc-400 break-all">{[group.masterWallet, group.devWallet, ...group.sniperWallets, ...group.executionWallets].filter(Boolean).join(', ') || 'None'}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy} onClick={async ()=>{
              setBusy(true);
              try{
                const r = await fetch('/api/groups/wallets', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ groupId: group.id, action:'create' })});
                if(!r.ok) throw new Error(await r.text());
                location.reload();
              }
catch(e:any){ alert(e?.message || 'failed'); } finally{ setBusy(false); }
            }} className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm">{busy?'Working...':'Generate Wallet'}</button>
            <div className="flex items-center gap-2">
              <input value={importKey} onChange={e=>setImportKey(e.target.value)} placeholder="Paste secret key JSON/base58" className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs w-64" />
              <button disabled={busy||!importKey.trim()} onClick={async ()=>{
                setBusy(true);
                try{
                  const r = await fetch('/api/groups/wallets', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ groupId: group.id, action:'import', secretKey: importKey })});
                  if(!r.ok) throw new Error(await r.text());
                  location.reload();
                }
catch(e:any){ alert(e?.message || 'failed'); } finally{ setBusy(false); }
              }} className="px-3 py-1.5 rounded-xl border border-zinc-800 text-sm">Import</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


