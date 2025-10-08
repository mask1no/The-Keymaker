'use client';
import useSWR from 'swr';

type PnL = {
  buys: number;
  sells: number;
  fees: number;
  realized: number;
  unrealized: number;
  net: number;
  count: number;
};

const fetcher = async (url: string): Promise<{ pnl: PnL }> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`PNL fetch failed: ${res.status}`);
  return res.json();
};

export default function PnlPage() {
  const { data, error, isLoading } = useSWR<{ pnl: PnL }>('/api/pnl', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  });
  if (isLoading) return <div className="p-6 text-sm text-zinc-500">Loading...</div>;
  if (error || !data) return <div className="p-6 text-sm text-red-400">P&L unavailable</div>;
  const p = data.pnl;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">P&amp;L</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tile label="Trades" value={p.count} />
        <Tile label="Buys (SOL)" value={p.buys.toFixed(4)} />
        <Tile label="Sells (SOL)" value={p.sells.toFixed(4)} />
        <Tile label="Fees (SOL)" value={p.fees.toFixed(4)} />
        <Tile label="Realized (SOL)" value={colorize(p.realized)} />
        <Tile label="Unrealized (SOL)" value={colorize(p.unrealized)} />
        <Tile label="Net (SOL)" value={colorize(p.net)} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function colorize(n: number) {
  const c = n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-zinc-200';
  return <span className={c}>{n.toFixed(4)}</span>;
}
