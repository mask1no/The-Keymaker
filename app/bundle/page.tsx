import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTrackedWallets } from '@/lib/server/wallets';

export const dynamic = 'force-dynamic';

async function MarketCard({ mint }: { mint: string | null }) {
  if (!mint) {
    return <div className="text-sm text-zinc-400">No mint selected</div>;
  }
  try {
    const res = await fetch(`/api/market/${mint}`, {
      cache: 'no-store',
      headers: { 'x-engine-token': process.env.ENGINE_API_TOKEN || '' },
    });
    if (!res.ok) throw new Error('failed');
    const data = (await res.json()) as any;
    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-zinc-400 text-xs">Price</div>
          <div className="text-lg font-semibold">{data.price?.toFixed?.(6) ?? data.price}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">24h</div>
          <div className="text-lg font-semibold">{data.priceChange24h ?? 0}%</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">FDV/MC</div>
          <div className="text-lg font-semibold">{data.marketCap ?? 0}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Liquidity</div>
          <div className="text-lg font-semibold">{data.liquidityUsd ?? 0}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Volume 24h</div>
          <div className="text-lg font-semibold">{data.volume24h ?? 0}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Top Pair</div>
          <div className="text-sm">
            {data.pair?.symbol ?? '—'} ({data.pair?.dex ?? '—'})
          </div>
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
  const c = cookies();
  const mint = c.get('km_mint')?.value || null;
  const amt = c.get('km_amt')?.value || '';
  const slp = c.get('km_slp')?.value || '';
  async function setMint(formData: FormData) {
    'use server';
    const m = String(formData.get('mint') || '').trim();
    const amount = String(formData.get('amount') || '').trim();
    const slippage = String(formData.get('slippage') || '').trim();
    if (m) cookies().set('km_mint', m, { httpOnly: false, sameSite: 'lax', path: '/' });
    if (amount) cookies().set('km_amt', amount, { httpOnly: false, sameSite: 'lax', path: '/' });
    if (slippage)
      cookies().set('km_slp', slippage, { httpOnly: false, sameSite: 'lax', path: '/' });
    revalidatePath('/bundle');
    redirect('/bundle');
  }
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="h1">Bundler</h1>
      <div className="bento">
        <div className="card">
          <div className="label mb-1">Market</div>
          <div className="text-sm">
            <form
              action={setMint}
              className="mb-2 grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
            >
              <input
                type="text"
                name="mint"
                defaultValue={mint ?? ''}
                placeholder="Token mint (base58)"
                className="input px-2 py-1 bg-zinc-900 w-full col-span-2"
              />
              <input
                type="number"
                step="0.001"
                name="amount"
                defaultValue={amt}
                placeholder="Amount SOL per wallet"
                className="input px-2 py-1 bg-zinc-900 w-full"
              />
              <input
                type="number"
                step="1"
                name="slippage"
                defaultValue={slp}
                placeholder="Slippage bps"
                className="input px-2 py-1 bg-zinc-900 w-full"
              />
              <button
                type="submit"
                className="button px-3 py-1 bg-zinc-800 hover:bg-zinc-700 col-span-1 md:col-auto"
              >
                Save
              </button>
            </form>
            <Suspense fallback={<SkeletonCard />}>
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
                  No tracked wallets.{' '}
                  <a className="underline" href="/wallets">
                    Configure →
                  </a>
                </div>
              );
            return (
              <div className="text-sm text-zinc-400">
                Shard PnL — temporarily disabled. Using wallets: {wallets.length}.{' '}
                <a className="underline" href="/wallets">
                  Edit →
                </a>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
