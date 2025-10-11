import 'server-only';
import { getDb } from '@/lib/db/sqlite';
import { logger } from '@/lib/logger';

interface Trade {
  id: number;
  ts: number;
  wallet: string;
  mint: string;
  side: 'buy' | 'sell';
  qty: number;
  priceLamports: number;
  feeLamports: number;
  priorityFeeLamports: number;
}

interface Position {
  mint: string;
  wallet?: string;
  totalBought: number;
  totalSold: number;
  currentHolding: number;
  avgBuyPrice: number;
  totalCost: number;
  realized_pnl: number;
  unrealized_pnl: number;
}

/**
 * Calculate P&L for a wallet/mint combination using FIFO accounting
 */
export async function calculatePnL(mint: string, wallet?: string): Promise<Position> {
  const db = await getDb();

  let trades: Trade[];
  if (wallet) {
    trades = await db.all('SELECT * FROM trades WHERE mint = ? AND wallet = ? ORDER BY ts ASC', [
      mint,
      wallet,
    ]);
  } else {
    trades = await db.all('SELECT * FROM trades WHERE mint = ? ORDER BY ts ASC', [mint]);
  }

  let totalBought = 0;
  let totalSold = 0;
  let totalCost = 0;
  let realizedPnl = 0;

  // FIFO queue for tracking cost basis
  const buyQueue: Array<{ qty: number; pricePerUnit: number; fees: number }> = [];

  for (const trade of trades) {
    const totalFees = trade.feeLamports + (trade.priorityFeeLamports || 0);

    if (trade.side === 'buy') {
      const pricePerUnit = trade.priceLamports / trade.qty;
      const costBasis = (trade.qty * pricePerUnit + totalFees) / 1e9;

      totalBought += trade.qty;
      totalCost += costBasis;

      buyQueue.push({
        qty: trade.qty,
        pricePerUnit,
        fees: totalFees,
      });
    } else {
      // Sell: match against FIFO buy orders
      let remaining = trade.qty;
      const sellPricePerUnit = trade.priceLamports / trade.qty;
      const sellFeesPerUnit = totalFees / trade.qty;

      while (remaining > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0];
        const qtyToMatch = Math.min(remaining, buy.qty);

        // Calculate realized P&L for this match
        const costBasis = (qtyToMatch * buy.pricePerUnit + buy.fees * (qtyToMatch / buy.qty)) / 1e9;
        const saleProceeds = (qtyToMatch * sellPricePerUnit - sellFeesPerUnit * qtyToMatch) / 1e9;
        realizedPnl += saleProceeds - costBasis;

        remaining -= qtyToMatch;
        buy.qty -= qtyToMatch;

        if (buy.qty === 0) {
          buyQueue.shift();
        }
      }

      totalSold += trade.qty - remaining; // Actual matched qty
    }
  }

  const currentHolding = totalBought - totalSold;
  const avgBuyPrice = totalBought > 0 ? totalCost / totalBought : 0;

  return {
    mint,
    wallet,
    totalBought,
    totalSold,
    currentHolding,
    avgBuyPrice,
    totalCost,
    realized_pnl: realizedPnl,
    unrealized_pnl: 0, // Would need current market price
  };
}

/**
 * Get all positions across wallets
 */
export async function getAllPositions(): Promise<Position[]> {
  const db = await getDb();

  const mints = await db.all('SELECT DISTINCT mint FROM trades ORDER BY MIN(ts) DESC LIMIT 50');

  const positions: Position[] = [];

  for (const { mint } of mints) {
    const position = await calculatePnL(mint);
    if (position.currentHolding > 0) {
      positions.push(position);
    }
  }

  return positions;
}

/**
 * Export P&L to CSV
 */
export async function exportPnLToCSV(): Promise<string> {
  const positions = await getAllPositions();

  const headers = [
    'Mint',
    'Wallet',
    'Total Bought',
    'Total Sold',
    'Current Holding',
    'Avg Buy Price',
    'Total Cost',
    'Realized P&L',
    'Unrealized P&L',
  ];

  const rows = positions.map((p) => [
    p.mint,
    p.wallet || 'All',
    p.totalBought,
    p.totalSold,
    p.currentHolding,
    p.avgBuyPrice.toFixed(9),
    p.totalCost.toFixed(4),
    p.realized_pnl.toFixed(4),
    p.unrealized_pnl.toFixed(4),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return csv;
}
