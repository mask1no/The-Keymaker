export const dynamic = 'force-dynamic';
import { useDraftStore } from '@/stores/useDraftStore';
import { useEffect, useState } from 'react';
import MarketPanel from '@/components/Coin/MarketPanel';

export default function CoinPage() {
  const draft = useDraftStore((s) => s.draft);
  const [market, setMarket] = useState<{ fdv?: number; price?: number } | null>(null);
  useEffect(() => {
    let abort = false;
    async function run() {
      // Example: update market panel placeholder once wired to a mint
      try {
        if (!draft) return;
        // Placeholder waits for buy/create flow to provide mint
      } catch {}
    }
    run();
    return () => {
      abort = true;
    };
  }, [draft]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h1 className="text-xl font-semibold">Coin</h1>
        <p className="text-sm text-muted-foreground">Create (Pump.fun), dev buy, multi-wallet buy, market-cap panel.</p>
        {draft && (
          <div className="mt-4 border border-zinc-800 rounded p-3">
            <div className="text-sm text-zinc-400">Prefilled from Coin Library:</div>
            <div className="mt-1 text-sm"><span className="text-zinc-500">Name</span>: {draft.name}</div>
            <div className="text-sm"><span className="text-zinc-500">Symbol</span>: {draft.symbol}</div>
          </div>
        )}
      </div>
      <MarketPanel />
    </div>
  );
}


