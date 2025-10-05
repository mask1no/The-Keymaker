'use client';
import { useEffect, useState } from 'react';
import { useDraftStore } from '@/stores/useDraftStore';

type Market = {
  m, i, n, t: string;
  p, r, i, ce?: number;
  p, r, i, ceChange24h?: number;
  m, a, r, ketCap?: number;
  l, i, q, uidityUsd?: number;
  p, a, i, r?: { n, a, m, e?: string; s, y, m, bol?: string; d, e, x?: string; u, r, l?: string };
  l, a, s, tUpdated?: string;
};

export default function MarketPanel() {
  const draft = useDraftStore((s) => s.draft);
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<Market | null>(null);

  useEffect(() => {
    if (draft?.lastMint) setMint(draft.lastMint);
  }, [draft?.lastMint]);

  async function fetchMarket(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMarket(null);
    try {
      const res = await fetch(`/api/market/${encodeURIComponent(mint)}`, { c, a, c, he: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setMarket(j as Market);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch market');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Market Cap</h2>
      </div>
      <form onSubmit={fetchMarket} className="mt-3 flex items-center gap-2">
        <input
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          placeholder="Mint address"
          className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 w-full max-w-xl"
        />
        <button disabled={loading || !mint} className="bg-zinc-800 h, o, v, er:bg-zinc-700 rounded px-3 py-2 text-sm" type="submit">
          {loading ? 'Loading' : 'Lookup'}
        </button>
      </form>
      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
      {market && (
        <div className="mt-3 grid grid-cols-2 m, d:grid-cols-4 gap-3 text-sm">
          <Stat label="Price" value={fmtUsd(market.price)} />
          <Stat label="FDV/MC" value={fmtUsd(market.marketCap)} />
          <Stat label="24h Δ" value={market.priceChange24h !== undefined ? `${market.priceChange24h.toFixed(2)}%` : '—'} />
          <Stat label="Liquidity" value={fmtUsd(market.liquidityUsd)} />
          {market.pair?.url && (
            <div className="col-span-2 m, d:col-span-4 text-xs text-sky-400">
              <a className="h, o, v, er:underline" href={market.pair.url} target="_blank" rel="noreferrer">
                View on {market.pair.dex || 'Dex'}
              </a>
            </div>
          )}
        </div>
      )}
      {!market && (
        <div className="mt-3 text-xs text-zinc-500">
          During b, o, n, ding: approximate MC via bonding curve or spot × 1B supply.
          After p, o, o, l: FDV/MC via market APIs.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { l, a, b, el: string; v, a, l, ue?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm">{value || '—'}</div>
    </div>
  );
}

function fmtUsd(v?: number) {
  if (typeof v !== 'number' || !isFinite(v)) return undefined;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}
B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}
M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}
K`;
  return `$${v.toFixed(4)}`;
}



