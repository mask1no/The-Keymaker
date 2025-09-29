import { aggregatePnL } from '@/lib/core/src/pnlAggregator';

export const dynamic = 'force-dynamic';

export default async function PnLPage() {
  const pnl = aggregatePnL({ dataDir: 'data' });
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="h1 mb-6">PnL Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="label mb-1">Realized P&L</div>
          <div className="text-2xl font-semibold">
            {(pnl.totalRealizedPnL / 1e9).toFixed(4)} SOL
          </div>
          <div className="text-xs text-zinc-400">From closed positions</div>
        </div>
        
        <div className="card">
          <div className="label mb-1">Unrealized P&L</div>
          <div className="text-2xl font-semibold">
            {(pnl.totalUnrealizedPnL / 1e9).toFixed(4)} SOL
          </div>
          <div className="text-xs text-zinc-400">From open positions</div>
        </div>
        
        <div className="card">
          <div className="label mb-1">Total P&L</div>
          <div className={`text-2xl font-semibold ${pnl.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(pnl.totalPnL / 1e9).toFixed(4)} SOL
          </div>
          <div className="text-xs text-zinc-400">Combined</div>
        </div>
      </div>
      
      <div className="card">
        <div className="label mb-4">Wallet Breakdown</div>
        
        {pnl.wallets.size === 0 ? (
          <div className="text-sm text-zinc-400">No trading activity yet</div>
        ) : (
          <div className="space-y-4">
            {Array.from(pnl.wallets.entries()).map(([wallet, walletPnL]) => (
              <div key={wallet} className="border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-xs">{wallet.slice(0, 8)}...{wallet.slice(-8)}</div>
                  <div className={`text-sm font-semibold ${walletPnL.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(walletPnL.totalPnL / 1e9).toFixed(4)} SOL
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-zinc-400">Realized</div>
                    <div>{(walletPnL.realizedPnL / 1e9).toFixed(4)} SOL</div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Unrealized</div>
                    <div>{(walletPnL.unrealizedPnL / 1e9).toFixed(4)} SOL</div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Positions</div>
                    <div>{walletPnL.positions.size}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
