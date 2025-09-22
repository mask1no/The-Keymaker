'use client';
import React from 'react';
import useSWR from 'swr';
type Trade = {
  id: number;
  token_address: string;
  tx_ids: string[];
  wallets: string[];
  sol_in: number;
  sol_out: number;
  pnl: number;
  executed_at?: string;
};
const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json());
export default function HistoryPage() {
  const { data, error, isLoading } = useSWR<{ trades: Trade[] }>('/api/trades?limit=50', fetcher);
  return (
    <div className="container mx-auto p-6">
      {' '}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        {' '}
        <h1 className="text-xl font-semibold mb-4">History</h1>{' '}
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}{' '}
        {error && (
          <div className="text-sm text-red-500">Failed to load history. Please try again.</div>
        )}{' '}
        {data && data.trades && data.trades.length === 0 && (
          <div className="text-sm text-muted-foreground">No records yet.</div>
        )}{' '}
        {data && data.trades && data.trades.length > 0 && (
          <div className="overflow-x-auto">
            {' '}
            <table className="w-full text-sm">
              {' '}
              <thead>
                {' '}
                <tr className="text-left text-muted-foreground">
                  {' '}
                  <th className="py-2 pr-3">Token</th> <th className="py-2 pr-3">SOL In</th>{' '}
                  <th className="py-2 pr-3">SOL Out</th> <th className="py-2 pr-3">PnL</th>{' '}
                  <th className="py-2 pr-3">Wallets</th> <th className="py-2 pr-3">Tx Count</th>{' '}
                  <th className="py-2">Time</th>{' '}
                </tr>{' '}
              </thead>{' '}
              <tbody>
                {' '}
                {data.trades.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    {' '}
                    <td className="py-2 pr-3 font-mono text-xs truncate max-w-[220px]">
                      {' '}
                      {t.token_address}{' '}
                    </td>{' '}
                    <td className="py-2 pr-3">{t.sol_in.toFixed(4)}</td>{' '}
                    <td className="py-2 pr-3">{t.sol_out.toFixed(4)}</td>{' '}
                    <td className={`py-2 pr-3 ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {' '}
                      {t.pnl.toFixed(4)}{' '}
                    </td>{' '}
                    <td className="py-2 pr-3">{t.wallets?.length ?? 0}</td>{' '}
                    <td className="py-2 pr-3">{t.tx_ids?.length ?? 0}</td>{' '}
                    <td className="py-2 text-muted-foreground">
                      {' '}
                      {t.executed_at ? new Date(t.executed_at).toLocaleString() : '—'}{' '}
                    </td>{' '}
                  </tr>
                ))}{' '}
              </tbody>{' '}
            </table>{' '}
          </div>
        )}{' '}
      </div>{' '}
    </div>
  );
}
