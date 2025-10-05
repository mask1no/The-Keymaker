/**
 * PNL Aggregation
 * Calculate realized/unrealized P&L from journal entries
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export interface PnLEntry {
  wallet: string;
  mint: string;
  entryPrice: number; // avg cost
  currentPrice: number; // spot
  amount: number; // position size
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
}

export interface GroupPnL {
  groupId: string;
  groupName: string;
  wallets: Map<string, WalletPnL>;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
}

export interface WalletPnL {
  wallet: string;
  positions: Map<string, PositionPnL>;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
}

export interface PositionPnL {
  mint: string;
  symbol?: string;
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
}

/**
 * Parse journal file
 */
function parseJournalFile(filePath: string): any[] {
  if (!existsSync(filePath)) {
    return [];
  }
  
  const content = readFileSync(filePath, 'utf8').trim();
  if (!content) return [];
  
  return content.split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Aggregate PnL from journal entries
 */
export function aggregatePnL(params: {
  dataDir: string;
  groupId?: string;
  runId?: string;
}): GroupPnL {
  const { dataDir, groupId, runId } = params;
  
  // Load all journal files
  const journalFiles = readdirSync(dataDir)
    .filter(f => f.startsWith('journal.') && f.endsWith('.ndjson'))
    .map(f => join(dataDir, f));
  
  const allEntries = journalFiles.flatMap(f => parseJournalFile(f));
  
  // Filter by groupId and runId if specified
  let entries = allEntries;
  if (groupId) {
    entries = entries.filter(e => e.groupId === groupId);
  }
  if (runId) {
    entries = entries.filter(e => e.runId === runId);
  }
  
  // Build PnL structure
  const walletPnLMap = new Map<string, WalletPnL>();
  
  for (const entry of entries) {
    // Observe Jupiter quote to infer price context
    if (entry.ev === 'jupiter_quote_received' || entry.ev === 'jupiter_sell_quote_received') {
      // Could cache price per (wallet,mint) for later aggregation
    }
    // Process buy confirmations (approximate P&L entries)
    if (entry.ev === 'rpc_confirmed' || entry.ev === 'jito_bundle_result') {
      const wallet = entry.wallet;
      if (!wallet || wallet === 'unknown' || wallet === 'bundled') continue;
      
      if (!walletPnLMap.has(wallet)) {
        walletPnLMap.set(wallet, {
          wallet,
          positions: new Map(),
          realizedPnL: 0,
          unrealizedPnL: 0,
          totalPnL: 0,
        });
      }
      
      // Track/initialize position record
      const walletPnL = walletPnLMap.get(wallet)!;
      const mint = entry.mint || 'unknown';
      
      if (!walletPnL.positions.has(mint)) {
        walletPnL.positions.set(mint, {
          mint,
          amount: 0,
          entryPrice: 0,
          realizedPnL: 0,
          unrealizedPnL: 0,
          totalPnL: 0,
        });
      }
      const pos = walletPnL.positions.get(mint)!;
      // If a trade record exists: update average cost and position size
      if (entry.ev === 'trade') {
        const qty = Number(entry.qty || 0);
        const price = Number(entry.price || 0);
        if (entry.side === 'buy' && qty > 0 && price > 0) {
          const prevCost = pos.entryPrice * pos.amount;
          const newCost = prevCost + qty * price;
          const newAmt = pos.amount + qty;
          pos.amount = newAmt;
          pos.entryPrice = newAmt > 0 ? newCost / newAmt : 0;
        }
        if (entry.side === 'sell' && qty > 0 && price > 0) {
          const sellProceeds = qty * price;
          const costOut = Math.min(qty, pos.amount) * pos.entryPrice;
          const realized = sellProceeds - costOut;
          pos.amount = Math.max(0, pos.amount - qty);
          walletPnL.realizedPnL += realized;
          walletPnL.totalPnL += realized;
        }
      }
    }
    
    // Process sell events
    if (entry.ev === 'sell_executed') {
      const wallet = entry.wallet;
      if (!wallet) continue;
      
      const walletPnL = walletPnLMap.get(wallet);
      if (walletPnL) {
        // Add realized P&L
        const pnl = entry.pnl || 0;
        walletPnL.realizedPnL += pnl;
        walletPnL.totalPnL += pnl;
      }
    }
  }
  
  // Calculate totals
  let totalRealizedPnL = 0;
  let totalUnrealizedPnL = 0;
  
  for (const walletPnL of walletPnLMap.values()) {
    totalRealizedPnL += walletPnL.realizedPnL;
    totalUnrealizedPnL += walletPnL.unrealizedPnL;
  }
  
  return {
    groupId: groupId || 'all',
    groupName: groupId || 'All Groups',
    wallets: walletPnLMap,
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalPnL: totalRealizedPnL + totalUnrealizedPnL,
  };
}

/**
 * Get PnL summary for display
 */
export function formatPnLSummary(pnl: GroupPnL): string {
  const lines = [
    `Group: ${pnl.groupName}`,
    `Wallets: ${pnl.wallets.size}`,
    `Realized P&L: ${(pnl.totalRealizedPnL / 1e9).toFixed(4)} SOL`,
    `Unrealized P&L: ${(pnl.totalUnrealizedPnL / 1e9).toFixed(4)} SOL`,
    `Total P&L: ${(pnl.totalPnL / 1e9).toFixed(4)} SOL`,
  ];
  
  return lines.join('\n');
}
