'use client';
import { useEffect, useState } from 'react';

type Trade = {
  id?: number;
  ts: number;
  side: 'buy' | 'sell';
  mint: string;
  qty: number;
  priceLamports: number;
  feeLamports: number;
  slot?: number | null;
  signature?: string | null;
  bundleId?: string | null;
  wallet?: string | null;
  groupId?: string | null;
  mode?: 'RPC' | 'JITO' | null;
};

function lamportsToSol(l: number): string {
  return (l / 1e9).toFixed(4);
}

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch('/api/trades?limit=200', { cache: 'no-store' });
        if (!r.ok) throw new Error('failed');
        const j = await r.json();
        if (!cancel) setTrades(j.trades || []);
      } catch (e: any) {
        if (!cancel) setError(e?.message || 'failed');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h1 className="text-xl font-semibold">Trade History</h1>
        {loading ? (
          <div className="text-sm text-muted-foreground mt-2">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-400 mt-2">{error}</div>
        ) : trades.length === 0 ? (
          <div className="text-sm text-muted-foreground mt-2">No trades yet.</div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-zinc-400">
                <tr>
                  <th className="text-left py-2 pr-4">Time</th>
                  <th className="text-left py-2 pr-4">Side</th>
                  <th className="text-left py-2 pr-4">Mint</th>
                  <th className="text-left py-2 pr-4">Qty</th>
                  <th className="text-left py-2 pr-4">Price (SOL)</th>
                  <th className="text-left py-2 pr-4">Fee (SOL)</th>
                  <th className="text-left py-2 pr-4">Sig/Bundle</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr
                    key={(t.id ?? `${t.ts}-${t.mint}-${t.side}`) as any}
                    className="border-t border-zinc-900"
                  >
                    <td className="py-2 pr-4">{new Date(t.ts).toLocaleString()}</td>
                    <td
                      className={`py-2 pr-4 ${t.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {t.side.toUpperCase()}
                    </td>
                    <td className="py-2 pr-4 break-all">{t.mint}</td>
                    <td className="py-2 pr-4">{t.qty}</td>
                    <td className="py-2 pr-4">{lamportsToSol(t.priceLamports)}</td>
                    <td className="py-2 pr-4">{lamportsToSol(t.feeLamports || 0)}</td>
                    <td className="py-2 pr-4 break-all">{t.signature || t.bundleId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
