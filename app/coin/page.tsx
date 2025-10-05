'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useDraftStore } from '@/stores/useDraftStore';
import MarketPanel from '@/components/Coin/MarketPanel';
import BuyPanel from '@/components/Coin/BuyPanel';
import PositionsTable from '@/components/Wallet/PositionsTable';
import CreateForm from '@/components/Coin/CreateForm';
import ConditionBuilder from '@/components/SellConditions/ConditionBuilder';

export default function CoinPage() {
  const draft = useDraftStore((s) => s.draft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [groupId, setGroupId] = useState<string>('');
  const [mint, setMint] = useState<string>('');
  useEffect(() => {
    let abort = false;
    async function run() {
      try {
        if (!draft) return;
        if (draft.lastMint) setMint(draft.lastMint);
      } catch {}
    }
    run();
    return () => {
      abort = true;
    };
  }, [draft]);

  // Auto-import from library clipboard/localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('coinDraft');
      if (raw) {
        const j = JSON.parse(raw);
        setDraft({
          name: j.name || '',
          symbol: j.symbol || '',
          image: j.image || '',
          description: j.description || '',
          website: j.website || '',
          twitter: j.twitter || '',
          telegram: j.telegram || '',
          lastMint: null,
        });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/groups', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (abort) return;
        const gs: Array<{ id: string; name: string }> = (j.groups || []).map((g: any) => ({ id: g.id, name: g.name }));
        setGroups(gs);
        if (gs.length && !groupId) setGroupId(gs[0].id);
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, [groupId]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h1 className="text-xl font-semibold">Coin</h1>
        <p className="text-sm text-muted-foreground">Create (Pump.fun), dev buulti-wallet buith quick market lookup.</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-zinc-800 , r:bg-zinc-700 text-sm"
            onClick={() => {
              navigator.clipboard.readText().then(txt => {
                try {
                  const j = JSON.parse(txt);
                  setDraft({
                    name: j.name || '',
                    symbol: j.symbol || '',
                    image: j.image || '',
                    description: j.description || '',
                    website: j.website || '',
                    twitter: j.twitter || '',
                    telegram: j.telegram || '',
                    lastMint: null,
                  });
                } catch {
                  alert('Clipboard did not contain JSON');
                }
              });
            }}
          >
            Paste from clipboard
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 :grid-cols-[1fr,380px] gap-4">
          <CreateForm />
          <div className="space-y-4">
            <MarketPanel />
            <div className="rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Sell Conditions</h3>
              </div>
              <div className="mt-3">
                <ConditionBuilder groupId={groupId} mint={mint} onChange={() => { /* handled by save button */ }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <MarketPanel />
      {mint ? (
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Buy {mint.slice(0,4)}...{mint.slice(-4)}</h2>
          </div>
          <BuyPanel mint={mint} groupId={groupId} onGroupIdChange={setGroupId} />
        </div>
      ) : null}
      {(groupId && mint) ? (
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Positions</h2>
            <div className="flex items-center gap-2 text-xs">
              <label>Group</label>
              <select className="input bg-zinc-900" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <label>Mint</label>
              <input value={mint} onChange={(e) => setMint(e.target.value)} className="input bg-zinc-900 w-[360px]" />
            </div>
          </div>
          <PositionsTable groupId={groupId} mint={mint} />
        </div>
      ) : null}
    </div>
  );
}






