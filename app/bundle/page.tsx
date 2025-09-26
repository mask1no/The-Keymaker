import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { getTrackedWallets } from '@/lib/server/wallets';

export const dynamic = 'force-dynamic';

async function MarketCard({ mint }: { mint: string | null }) {
  if (!mint) {
    return <div className="text-sm text-zinc-400">No mint selected</div>;
  }
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || '';
    const res = await fetch(`${base}/api/market/${mint}`, { cache: 'no-store', headers: { 'x-engine-token': process.env.ENGINE_API_TOKEN || '' } });
    if (!res.ok) throw new Error('failed');
    const data = (await res.json()) as any;
    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-zinc-400 text-xs">Price</div>
          <div className="text-lg font-semibold">${'{'}data.price?.toFixed?.(6) ?? data.price{'}'}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">24h</div>
          <div className="text-lg font-semibold">${'{'}data.priceChange24h ?? 0{'}'}%</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">FDV/MC</div>
          <div className="text-lg font-semibold">${'{'}data.marketCap ?? 0{'}'}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Liquidity</div>
          <div className="text-lg font-semibold">${'{'}data.liquidityUsd ?? 0{'}'}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Volume 24h</div>
          <div className="text-lg font-semibold">${'{'}data.volume24h ?? 0{'}'}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Top Pair</div>
          <div className="text-sm">${'{'}data.pair?.symbol ?? '—'}{' '}(${ '{'}data.pair?.dex ?? '—'{ }'})</div>
        </div>
      </div>
    );
  } catch {
    return <div className="text-sm text-zinc-400">Failed to load market data</div>;
  }
}

function SkeletonCard() {
  return <div className="card h-24 animate-pulse bg-zinc-900/40" />;
}

export default async function Page() {
  const mint = cookies().get('km_mint')?.value || null;
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="h1">Bundler</h1>
      <div className="bento">
        <div className="card">
          <div className="label mb-1">Market</div>
          <div className="text-sm">
            <Suspense fallback={<SkeletonCard />}>
              {/* @ts-expect-error Async Server Component */}
              <MarketCard mint={mint} />
            </Suspense>
          </div>
        </div>
        <div className="card">
          <div className="label mb-1">PnL snapshot</div>
          {(() => {
            const wallets = getTrackedWallets();
            if (!wallets.length)
              return (
                <div className="text-sm text-zinc-400">
                  No tracked wallets. <a className="underline" href="/wallets">Configure →</a>
                </div>
              );
            return (
              <div className="text-sm text-zinc-400">
                Shard PnL — temporarily disabled. Using wallets: {wallets.length}.{' '}
                <a className="underline" href="/wallets">Edit →</a>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
