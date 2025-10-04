"use client";
import React from 'react';
import StatusBentoPanel from '@/components/UI/StatusBentoPanel';
import EventsPanel from '@/components/Engine/EventsPanel';
import KCard from '@/components/UI/KCard';
import BadgePill from '@/components/UI/BadgePill';
import CodeBlock from '@/components/UI/CodeBlock';

export default function HomePage(){
  const cross = `PowerShell:  solana-keygen pubkey "$Env:KEYPAIR_JSON"
macOS/Linux: solana-keygen pubkey ~/keymaker-payer.json`;
  const proof = `curl -s /api/engine/prove -H "x-engine-token: $ENGINE_API_TOKEN"`;

  const [groups, setGroups] = React.useState<Array<{ id: string; name: string }>>([]);
  const [groupId, setGroupId] = React.useState<string>('');
  const [mint, setMint] = React.useState<string>('');
  const [amount, setAmount] = React.useState<number>(0.0005);
  React.useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const r = await fetch('/api/groups', { cache: 'no-store' });
        const j = await r.json();
        if (!abort) {
          const gs = (j.groups || []).map((g: any) => ({ id: g.id, name: g.name }));
          setGroups(gs);
          if (gs.length && !groupId) setGroupId(gs[0].id);
        }
      } catch {}
    })();
    return () => { abort = true; };
  }, [groupId]);
  function getCsrf(): string {
    if (typeof document === 'undefined') return '';
    return document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '';
  }
  async function dryRun(kind: 'jito'|'rpc') {
    if (!groupId) { alert('Select a group'); return; }
    if (!mint) { alert('Enter token mint'); return; }
    const token = getCsrf();
    const url = kind === 'jito' ? '/api/engine/jito/buy' : '/api/engine/rpc/buy';
    const body = { groupId, mint, amountSol: amount, slippageBps: 100, dryRun: true } as any;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': token }, body: JSON.stringify(body) });
      if (!r.ok) alert(`${kind.toUpperCase()} dry-run failed`); else alert(`${kind.toUpperCase()} dry-run queued`);
    } catch {}
  }
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Engine</h1>
        <BadgePill tone="accent">Execution: JITO_BUNDLE</BadgePill>
        <BadgePill tone="warn">DryRun: ON</BadgePill>
        <BadgePill>Cluster: mainnet-beta</BadgePill>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <KCard>
            <div className="text-sm font-medium mb-2">Verify Deposit & Proof</div>
            <div className="text-xs text-zinc-500 mb-1">Deposit pubkey: Not configured</div>
            <div className="text-sm">Step 1: Cross-check</div>
            <CodeBlock code={cross}/>
            <div className="mt-2 text-sm">Step 2: Proof (no funds)</div>
            <CodeBlock code={proof}/>
          </KCard>

          <KCard>
            <div className="text-sm font-medium mb-2">Safety</div>
            <div className="flex items-center gap-2">
              <button className="bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm">Arm 15m</button>
              <button className="border border-zinc-800 hover:bg-zinc-900 rounded px-3 py-2 text-sm">Disarm</button>
              <div className="ml-2 text-xs text-zinc-500">Arming enables live sends for a limited window. Disarm to return to simulation.</div>
            </div>
          </KCard>

          <KCard>
            <div className="text-sm font-medium mb-2">Quick DRY-Run Dust Buy</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500">Group</label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm" value={groupId} onChange={e=>setGroupId(e.target.value)}>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500">Token Mint</label>
                <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm" value={mint} onChange={e=>setMint(e.target.value)} placeholder="Token mint address"/>
              </div>
              <div>
                <label className="text-xs text-zinc-500">SOL</label>
                <input type="number" min={0.0001} step={0.0001} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm" value={amount} onChange={e=>setAmount(Number(e.target.value))}/>
              </div>
              <div className="md:col-span-3 flex items-end gap-2">
                <button className="bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm" onClick={()=>dryRun('jito')}>JITO dust (DRY)</button>
                <button className="bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm" onClick={()=>dryRun('rpc')}>RPC dust (DRY)</button>
                <a className="border border-zinc-800 hover:bg-zinc-900 rounded px-3 py-2 text-sm text-center" href="/settings">Open Settings</a>
              </div>
            </div>
          </KCard>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <KCard>
            <div className="text-sm font-medium mb-2">Live Health</div>
            <StatusBentoPanel />
          </KCard>
          <KCard>
            <div className="text-sm font-medium mb-2">Last 10 Events</div>
            <EventsPanel />
          </KCard>
        </div>
      </div>
    </div>
  );
}
