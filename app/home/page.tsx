"use client";
import StatusBentoPanel from '@/components/UI/StatusBentoPanel';
import KCard from '@/components/UI/KCard';
import BadgePill from '@/components/UI/BadgePill';
import CodeBlock from '@/components/UI/CodeBlock';

export default function HomePage(){
  const cross = `PowerShell:  solana-keygen pubkey "$Env:KEYPAIR_JSON"
macOS/Linux: solana-keygen pubkey ~/keymaker-payer.json`;
  const proof = `curl -s /api/engine/prove -H "x-engine-token: $ENGINE_API_TOKEN"`;

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
            <div className="text-sm font-medium mb-2">Run Test Bundle</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500">Mode</label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm">
                  <option>JITO_BUNDLE</option><option>RPC_FANOUT</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Amount per wallet (SOL)</label>
                <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm" defaultValue="0.001"/>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Slippage (bps)</label>
                <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm" defaultValue="100"/>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Tip / Priority Fee</label>
                <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm" defaultValue="100000"/>
              </div>
              <div className="md:col-span-2">
                <button className="w-full bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm">Run Test</button>
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
            <div className="text-xs text-zinc-500">No events yet</div>
          </KCard>
        </div>
      </div>
    </div>
  );
}
