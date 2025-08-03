import { Connection } from '@solana/web3.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { getTokenPrice } from './jupiterService';

interface PnLEntry {
  wallet: string;
  tokenAddress: string;
  action: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: number;
}

export interface WalletPnL {
  wallet: string;
  totalInvested: number;
  totalReturned: number;
  netPnL: number;
  pnlPercentage: number;
  trades: number;
}

interface TokenPnL {
  tokenAddress: string;
  buyAmount: number;
  sellAmount: number;
  avgBuyPrice: number;
  avgSellPrice: number;
  realizedPnL: number;
  unrealizedPnL: number;
}

async function getDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'analytics.db'),
    driver: sqlite3.Database
  });
}

// Initialize PnL tracking table
async function initializePnLTable() {
  const db = await getDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pnl_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL,
      token_address TEXT NOT NULL,
      action TEXT NOT NULL,
      sol_amount REAL NOT NULL,
      token_amount REAL NOT NULL,
      price REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indices for performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pnl_wallet ON pnl_tracking(wallet);
    CREATE INDEX IF NOT EXISTS idx_pnl_token ON pnl_tracking(token_address);
    CREATE INDEX IF NOT EXISTS idx_pnl_timestamp ON pnl_tracking(timestamp);
  `);
  
  await db.close();
}

// Track a buy transaction
export async function trackBuy(
  wallet: string,
  tokenAddress: string,
  solSpent: number,
  tokenReceived: number
): Promise<void> {
  const db = await getDb();
  const price = solSpent / tokenReceived;
  
  await db.run(`
    INSERT INTO pnl_tracking (wallet, token_address, action, sol_amount, token_amount, price, timestamp)
    VALUES (?, ?, 'buy', ?, ?, ?, ?)
  `, [wallet, tokenAddress, solSpent, tokenReceived, price, Date.now()]);
  
  await db.close();
}

// Track a sell transaction
export async function trackSell(
  wallet: string,
  tokenAddress: string,
  solReceived: number,
  tokenSold: number
): Promise<void> {
  const db = await getDb();
  const price = solReceived / tokenSold;
  
  await db.run(`
    INSERT INTO pnl_tracking (wallet, token_address, action, sol_amount, token_amount, price, timestamp)
    VALUES (?, ?, 'sell', ?, ?, ?, ?)
  `, [wallet, tokenAddress, solReceived, tokenSold, price, Date.now()]);
  
  await db.close();
}

// Get PnL for a specific wallet
export async function getWalletPnL(wallet: string): Promise<WalletPnL> {
  const db = await getDb();
  
  const entries = await db.all<PnLEntry[]>(`
    SELECT * FROM pnl_tracking WHERE wallet = ? ORDER BY timestamp
  `, wallet);
  
  let totalInvested = 0;
  let totalReturned = 0;
  
  entries.forEach(entry => {
    if (entry.action === 'buy') {
      totalInvested += entry.solAmount;
    } else {
      totalReturned += entry.solAmount;
    }
  });
  
  const netPnL = totalReturned - totalInvested;
  const pnlPercentage = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0;
  
  await db.close();
  
  return {
    wallet,
    totalInvested,
    totalReturned,
    netPnL,
    pnlPercentage,
    trades: entries.length
  };
}

// Get PnL for all wallets
export async function getAllWalletsPnL(): Promise<WalletPnL[]> {
  const db = await getDb();
  
  const wallets = await db.all<{ wallet: string }[]>(`
    SELECT DISTINCT wallet FROM pnl_tracking
  `);
  
  await db.close();
  
  const pnlData = await Promise.all(
    wallets.map(w => getWalletPnL(w.wallet))
  );
  
  return pnlData;
}

// Get PnL for specific token across all wallets
export async function getTokenPnL(
  tokenAddress: string,
  connection?: Connection
): Promise<TokenPnL> {
  const db = await getDb();
  
  const entries = await db.all<PnLEntry[]>(`
    SELECT * FROM pnl_tracking WHERE token_address = ?
  `, tokenAddress);
  
  let totalBought = 0;
  let totalBoughtSOL = 0;
  let totalSold = 0;
  let totalSoldSOL = 0;
  
  entries.forEach(entry => {
    if (entry.action === 'buy') {
      totalBought += entry.tokenAmount;
      totalBoughtSOL += entry.solAmount;
    } else {
      totalSold += entry.tokenAmount;
      totalSoldSOL += entry.solAmount;
    }
  });
  
  const avgBuyPrice = totalBought > 0 ? totalBoughtSOL / totalBought : 0;
  const avgSellPrice = totalSold > 0 ? totalSoldSOL / totalSold : 0;
  const realizedPnL = totalSoldSOL - (totalSold * avgBuyPrice);
  
  // Calculate unrealized P&L if we have unsold tokens
  let unrealizedPnL = 0;
  const unsoldTokens = totalBought - totalSold;
  
  if (unsoldTokens > 0 && connection) {
    try {
      const currentPrice = await getTokenPrice(tokenAddress, 'WSOL');
      unrealizedPnL = (currentPrice * unsoldTokens) - (avgBuyPrice * unsoldTokens);
    } catch (error) {
      console.error('Failed to get current price for unrealized PnL:', error);
    }
  }
  
  await db.close();
  
  return {
    tokenAddress,
    buyAmount: totalBought,
    sellAmount: totalSold,
    avgBuyPrice,
    avgSellPrice,
    realizedPnL,
    unrealizedPnL
  };
}

// Get session PnL (last 24 hours)
export async function getSessionPnL(): Promise<{
  totalPnL: number;
  pnlPercentage: number;
  totalVolume: number;
  profitableWallets: number;
  totalWallets: number;
}> {
  const db = await getDb();
  const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  const entries = await db.all<PnLEntry[]>(`
    SELECT * FROM pnl_tracking WHERE timestamp > ?
  `, dayAgo);
  
  await db.close();
  
  // Group by wallet
  const walletData = new Map<string, { invested: number; returned: number }>();
  
  entries.forEach(entry => {
    const current = walletData.get(entry.wallet) || { invested: 0, returned: 0 };
    
    if (entry.action === 'buy') {
      current.invested += entry.solAmount;
    } else {
      current.returned += entry.solAmount;
    }
    
    walletData.set(entry.wallet, current);
  });
  
  let totalPnL = 0;
  let totalInvested = 0;
  let totalVolume = 0;
  let profitableWallets = 0;
  
  walletData.forEach(data => {
    const pnl = data.returned - data.invested;
    totalPnL += pnl;
    totalInvested += data.invested;
    totalVolume += data.invested + data.returned;
    
    if (pnl > 0) profitableWallets++;
  });
  
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  return {
    totalPnL,
    pnlPercentage,
    totalVolume,
    profitableWallets,
    totalWallets: walletData.size
  };
}

// Export PnL data as JSON
export async function exportPnLData(format: 'json' | 'csv' = 'json'): Promise<string> {
  const [walletPnL, sessionPnL] = await Promise.all([
    getAllWalletsPnL(),
    getSessionPnL()
  ]);
  
  const data = {
    timestamp: new Date().toISOString(),
    session: sessionPnL,
    wallets: walletPnL
  };
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else {
    // CSV format
    let csv = 'Wallet,Total Invested,Total Returned,Net PnL,PnL %,Trades\n';
    walletPnL.forEach(w => {
      csv += `${w.wallet},${w.totalInvested.toFixed(4)},${w.totalReturned.toFixed(4)},${w.netPnL.toFixed(4)},${w.pnlPercentage.toFixed(2)}%,${w.trades}\n`;
    });
    return csv;
  }
}

// Clear old PnL data (older than 30 days)
export async function cleanupOldPnLData(): Promise<void> {
  const db = await getDb();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  await db.run(`
    DELETE FROM pnl_tracking WHERE timestamp < ?
  `, thirtyDaysAgo);
  
  await db.close();
}

// Save completed trade to trades table
export async function saveCompletedTrade(
  tokenAddress: string,
  txIds: string[],
  wallets: string[],
  solIn: number,
  solOut: number
): Promise<void> {
  const db = await getDb();
  
  const pnl = solOut > 0 ? ((solOut - solIn) / solIn) * 100 : -100;
  
  await db.run(`
    INSERT INTO trades (token_address, tx_ids, wallets, sol_in, sol_out, pnl)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    tokenAddress,
    JSON.stringify(txIds),
    JSON.stringify(wallets),
    solIn,
    solOut,
    pnl
  ]);
  
  await db.close();
}

// Initialize table on module load
initializePnLTable().catch(console.error); 