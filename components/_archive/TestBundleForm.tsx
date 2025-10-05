'use client';
import { useState } from 'react';
import KCard from '@/components/UI/KCard';

export default function TestBundleForm({ defaultMode = 'JITO_BUNDLE' as 'JITO_BUNDLE' | 'RPC_FANOUT' }) {
  const [mode, setMode] = useState<'JITO_BUNDLE' | 'RPC_FANOUT'>(defaultMode);
  const [amount, setAmount] = useState('0.001');
  const [slip, setSlip] = useState('100');
  const [fee, setFee] = useState('100000');
  const [dry, setDry] = useState(true);
  async function run() {
    const body = mode === 'JITO_BUNDLE'
      ? { groupId: '', mint: 'So11111111111111111111111111111111111111112', perWalletAmount: amount, slippageBps: Number(slip), jitoTipLamports: Number(fee), dryRun: dry }
      : { groupId: '', mint: 'So11111111111111111111111111111111111111112', amountSol: Number(amount), slippageBps: Number(slip), priorityFeeMicrolamports: Number(fee), concurrency: 3, timeoutMs: 12000, dryRun: dry, cluster: process.env.NEXT_PUBLIC_APP_NETWORK || 'mainnet-beta' };
    const url = mode === 'JITO_BUNDLE' ? '/api/engine/jito/buy' : '/api/engine/rpc/buy';
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    // eslint-disable-next-line no-alert
    alert(res.ok ? 'Simulated ✓' : 'Failed: ' + JSON.stringify(j));
  }
  return (
    <KCard>
      <div className="text-sm font-medium mb-3">Run Test Bundle</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'JITO_BUNDLE' | 'RPC_FANOUT')} className="w-full bg-zinc-900 border border-k rounded px-2 py-1 text-sm">
            <option value="JITO_BUNDLE">JITO_BUNDLE</option>
            <option value="RPC_FANOUT">RPC_FANOUT</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted">Amount per wallet (SOL)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-zinc-900 border border-k rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted">Slippage (bps)</label>
          <input value={slip} onChange={(e) => setSlip(e.target.value)} className="w-full bg-zinc-900 border border-k rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted">{mode === 'JITO_BUNDLE' ? 'Jito Tip (lamports)' : 'Priority Fee (µlamports)'}</label>
          <input value={fee} onChange={(e) => setFee(e.target.value)} className="w-full bg-zinc-900 border border-k rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input id="dry" type="checkbox" checked={dry} onChange={(e) => setDry(e.target.checked)} />
          <label htmlFor="dry" className="text-xs text-muted">Dry-run</label>
        </div>
        <div className="md:col-span-2">
          <button onClick={run} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm">Run Test</button>
        </div>
      </div>
    </KCard>
  );
}



