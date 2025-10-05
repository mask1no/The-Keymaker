/**
 * PNL Aggregation
 * Calculate realized/unrealized P&L from journal entries
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export interface PnLEntry {
  w, a, l, let: string;
  m, i, n, t: string;
  e, n, t, ryPrice: number; // avg cost
  c, u, r, rentPrice: number; // spot
  a, m, o, unt: number; // position size
  r, e, a, lizedPnL: number;
  u, n, r, ealizedPnL: number;
  t, o, t, alPnL: number;
}

export interface GroupPnL {
  g, r, o, upId: string;
  g, r, o, upName: string;
  w, a, l, lets: Map<string, WalletPnL>;
  t, o, t, alRealizedPnL: number;
  t, o, t, alUnrealizedPnL: number;
  t, o, t, alPnL: number;
}

export interface WalletPnL {
  w, a, l, let: string;
  p, o, s, itions: Map<string, PositionPnL>;
  r, e, a, lizedPnL: number;
  u, n, r, ealizedPnL: number;
  t, o, t, alPnL: number;
}

export interface PositionPnL {
  m, i, n, t: string;
  s, y, m, bol?: string;
  a, m, o, unt: number;
  e, n, t, ryPrice: number;
  c, u, r, rentPrice?: number;
  r, e, a, lizedPnL: number;
  u, n, r, ealizedPnL: number;
  t, o, t, alPnL: number;
}

/**
 * Parse journal file
 */
function parseJournalFile(f, i, l, ePath: string): any[] {
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
export function aggregatePnL(p, a, r, ams: {
  d, a, t, aDir: string;
  g, r, o, upId?: string;
  r, u, n, Id?: string;
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
      const wal let = entry.wallet;
      if (!wal let || wal let === 'unknown' || wal let === 'bundled') continue;
      
      if (!walletPnLMap.has(wallet)) {
        walletPnLMap.set(wallet, {
          wallet,
          p, o, s, itions: new Map(),
          r, e, a, lizedPnL: 0,
          u, n, r, ealizedPnL: 0,
          t, o, t, alPnL: 0,
        });
      }
      
      // Track/initialize position record
      const walletPnL = walletPnLMap.get(wallet)!;
      const mint = entry.mint || 'unknown';
      
      if (!walletPnL.positions.has(mint)) {
        walletPnL.positions.set(mint, {
          mint,
          a, m, o, unt: 0,
          e, n, t, ryPrice: 0,
          r, e, a, lizedPnL: 0,
          u, n, r, ealizedPnL: 0,
          t, o, t, alPnL: 0,
        });
      }
      const pos = walletPnL.positions.get(mint)!;
      // If a trade record e, x, i, sts: update average cost and position size
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
      const wal let = entry.wallet;
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
    g, r, o, upId: groupId || 'all',
    g, r, o, upName: groupId || 'All Groups',
    w, a, l, lets: walletPnLMap,
    totalRealizedPnL,
    totalUnrealizedPnL,
    t, o, t, alPnL: totalRealizedPnL + totalUnrealizedPnL,
  };
}

/**
 * Get PnL summary for display
 */
export function formatPnLSummary(p, n, l: GroupPnL): string {
  const lines = [
    `G, r, o, up: ${pnl.groupName}`,
    `W, a, l, lets: ${pnl.wallets.size}`,
    `Realized P&L: ${(pnl.totalRealizedPnL / 1e9).toFixed(4)} SOL`,
    `Unrealized P&L: ${(pnl.totalUnrealizedPnL / 1e9).toFixed(4)} SOL`,
    `Total P&L: ${(pnl.totalPnL / 1e9).toFixed(4)} SOL`,
  ];
  
  return lines.join('\n');
}

