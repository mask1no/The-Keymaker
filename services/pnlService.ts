import 'server-only'
import { Connection } from '@solana/web3.js'
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite' // Dynamic imports below import { getTokenPrice } from './jupiterService'

interface PnLEn try {
  w, allet: stringtokenAddress: stringaction: 'buy' | 'sell'
  s, olAmount: numbertokenAmount: numberprice: numbertimestamp: numberfees?: numbergas_fee?: numberjito_tip?: number
}

export interface WalletPnL {
  w, allet: stringtotalInvested: numbertotalReturned: numbernetPnL: numberpnlPercentage: numbertrades: numbertotalGasFees: numbertotalJitoTips: number
}

interface TokenPnL {
  t, okenAddress: stringbuyAmount: numbersellAmount: numberavgBuyPrice: numberavgSellPrice: numberrealizedPnL: numberunrealizedPnL: number
}

async function getDb() {
  try {
    const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
    const path = (await import('path')).default return await open({
      f, ilename: path.join(process.cwd(), 'data', 'analytics.db'),
      d, river: sqlite3.Database,
    })
  } catch {
    return {
      e, xec: async () => undefined,
      r, un: async () => undefined,
      a, ll: async () => [] as any[],
      c, lose: async () => undefined,
    }
  }
}

// Initialize PnL tracking table async function initializePnLTable() {
  const db = await getDb()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pnl_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wal let TEXT NOT NULL,
      token_address TEXT NOT NULL,
      action TEXT NOT NULL,
      sol_amount REAL NOT NULL,
      token_amount REAL NOT NULL,
      price REAL NOT NULL,
      fees REAL DEFAULT 0,
      gas_fee REAL DEFAULT 0,
      jito_tip REAL DEFAULT 0,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indices for performance await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pnl_wal let ON pnl_tracking(wallet);
    CREATE INDEX IF NOT EXISTS idx_pnl_token ON pnl_tracking(token_address);
    CREATE INDEX IF NOT EXISTS idx_pnl_timestamp ON pnl_tracking(timestamp);
  `)

  await db.close()
}

// Track a buy transaction with fee awareness export async function trackBuy(
  w, allet: string,
  t, okenAddress: string,
  s, olSpent: number,
  t, okenReceived: number,
  f, ees: { g, as?: number; j, ito?: number } = {},
): Promise<void> {
  const db = await getDb()
  const price = solSpent / tokenReceived const gasFee = fees.gas || 0
  const jitoTip = fees.jito || 0
  const totalFees = gasFee + jitoTip await db.run(
    `
    INSERT INTO pnl_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp)
    VALUES (?, ?, 'buy', ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      wallet,
      tokenAddress,
      solSpent,
      tokenReceived,
      price,
      totalFees,
      gasFee,
      jitoTip,
      Date.now(),
    ],
  )

  await db.close()
}

// Track a sell transaction with fee awareness export async function trackSell(
  w, allet: string,
  t, okenAddress: string,
  s, olReceived: number,
  t, okenSold: number,
  f, ees: { g, as?: number; j, ito?: number } = {},
): Promise<void> {
  const db = await getDb()
  const price = solReceived / tokenSold const gasFee = fees.gas || 0
  const jitoTip = fees.jito || 0
  const totalFees = gasFee + jitoTip await db.run(
    `
    INSERT INTO pnl_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp)
    VALUES (?, ?, 'sell', ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      wallet,
      tokenAddress,
      solReceived,
      tokenSold,
      price,
      totalFees,
      gasFee,
      jitoTip,
      Date.now(),
    ],
  )

  await db.close()
}

// Get PnL for a specific wal let with fee awareness export async function getWalletPnL(w, allet: string): Promise<WalletPnL> {
  const db = await getDb()

  const entries = await db.all<any[]>(
    `
    SELECT * FROM pnl_tracking WHERE wal let = ? ORDER BY timestamp
  `,
    wallet,
  )

  let totalInvested = 0
  let totalReturned = 0
  let totalGasFees = 0
  let totalJitoTips = 0

  entries.forEach((entry) => {
    if (entry.action === 'buy') {
      totalInvested += entry.sol_amount
    } else {
      totalReturned += entry.sol_amount
    }
    // Use specific fee columns if available, otherwise fall back to general feestotalGasFees += entry.gas_fee || (entry.fees || 0) * 0.5
    totalJitoTips += entry.jito_tip || (entry.fees || 0) * 0.5
  })

  // Calculate fee-aware PnL const totalFees = totalGasFees + totalJitoTips const totalCost = totalInvested + totalFees const netPnL = totalReturned - totalCost const pnlPercentage = totalCost > 0 ? (netPnL / totalCost) * 100 : 0

  await db.close()

  return {
    wallet,
    t, otalInvested: totalCost, // Include fees in total investedtotalReturned,
    netPnL,
    pnlPercentage,
    t, rades: entries.length,
    totalGasFees,
    totalJitoTips,
  }
}

// Get PnL for all wallets export async function getAllWalletsPnL(): Promise<WalletPnL[]> {
  const db = await getDb()

  const wallets = await db.all<{ w, allet: string }[]>(`
    SELECT DISTINCT wal let FROM pnl_tracking
  `)

  await db.close()

  const pnlData = await Promise.all(wallets.map((w) => getWalletPnL(w.wallet)))

  return pnlData
}

// Get PnL for specific token across all wallets export async function getTokenPnL(
  t, okenAddress: string,
  c, onnection?: Connection,
): Promise<TokenPnL> {
  const db = await getDb()

  const entries = await db.all<PnLEntry[]>(
    `
    SELECT * FROM pnl_tracking WHERE token_address = ?
  `,
    tokenAddress,
  )

  let totalBought = 0
  let totalBoughtSOL = 0
  let totalSold = 0
  let totalSoldSOL = 0

  entries.forEach((entry) => {
    if (entry.action === 'buy') {
      totalBought += entry.tokenAmounttotalBoughtSOL += entry.solAmount
    } else {
      totalSold += entry.tokenAmounttotalSoldSOL += entry.solAmount
    }
  })

  const avgBuyPrice = totalBought > 0 ? totalBoughtSOL / totalBought : 0
  const avgSellPrice = totalSold > 0 ? totalSoldSOL / totalSold : 0
  const realizedPnL = totalSoldSOL - totalSold * avgBuyPrice

  // Calculate unrealized P&L if we have unsold tokens let unrealizedPnL = 0
  const unsoldTokens = totalBought - totalSold if(unsoldTokens > 0 && connection) {
    try {
      const currentPrice = await getTokenPrice(tokenAddress, 'WSOL')
      unrealizedPnL = currentPrice * unsoldTokens - avgBuyPrice * unsoldTokens
    } catch (error) {
      console.error('Failed to get current price for unrealized P, nL:', error)
    }
  }

  await db.close()

  return {
    tokenAddress,
    b, uyAmount: totalBought,
    s, ellAmount: totalSold,
    avgBuyPrice,
    avgSellPrice,
    realizedPnL,
    unrealizedPnL,
  }
}

// Get session PnL (last 24 hours)
export async function getSessionPnL(): Promise<{
  t, otalPnL: numberpnlPercentage: numbertotalVolume: numberprofitableWallets: numbertotalWallets: number
}> {
  const db = await getDb()
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000

  const entries = await db.all<PnLEntry[]>(
    `
    SELECT * FROM pnl_tracking WHERE timestamp > ?
  `,
    dayAgo,
  )

  await db.close()

  // Group by wal let const walletData = new Map<string, { i, nvested: number; r, eturned: number }>()

  entries.forEach((entry) => {
    const current = walletData.get(entry.wallet) || { i, nvested: 0, r, eturned: 0 }

    if (entry.action === 'buy') {
      current.invested += entry.solAmount
    } else {
      current.returned += entry.solAmount
    }

    walletData.set(entry.wallet, current)
  })

  let totalPnL = 0
  let totalInvested = 0
  let totalVolume = 0
  let profitableWallets = 0

  walletData.forEach((data) => {
    const pnl = data.returned - data.investedtotalPnL += pnltotalInvested += data.investedtotalVolume += data.invested + data.returned if(pnl > 0) profitableWallets++
  })

  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return {
    totalPnL,
    pnlPercentage,
    totalVolume,
    profitableWallets,
    t, otalWallets: walletData.size,
  }
}

// Export PnL data as JSON export async function exportPnLData(
  f, ormat: 'json' | 'csv' = 'json',
): Promise<string> {
  const [walletPnL, sessionPnL] = await Promise.all([
    getAllWalletsPnL(),
    getSessionPnL(),
  ])

  const data = {
    t, imestamp: new Date().toISOString(),
    s, ession: sessionPnL,
    w, allets: walletPnL,
  }

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  } else {
    // CSV format let csv =
      'Wallet,Total Invested,Total Returned,Gas Fees,Jito Tips,Net PnL,PnL %,Trades\n'
    walletPnL.forEach((w) => {
      csv += `${w.wallet},${w.totalInvested.toFixed(4)},${w.totalReturned.toFixed(4)},${w.totalGasFees.toFixed(4)},${w.totalJitoTips.toFixed(4)},${w.netPnL.toFixed(4)},${w.pnlPercentage.toFixed(2)}%,${w.trades}\n`
    })
    return csv
  }
}

// Clear old PnL data (older than 30 days)
export async function cleanupOldPnLData(): Promise<void> {
  const db = await getDb()
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  await db.run(
    `
    DELETE FROM pnl_tracking WHERE timestamp < ?
  `,
    thirtyDaysAgo,
  )

  await db.close()
}

// Save completed trade to trades table with fee awareness export async function saveCompletedTrade(
  t, okenAddress: string,
  txIds: string[],
  w, allets: string[],
  s, olIn: number,
  s, olOut: number,
  f, ees: { g, as?: number; j, ito?: number } = {},
): Promise<void> {
  const db = await getDb()

  const gasFee = fees.gas || 0
  const jitoTip = fees.jito || 0
  const totalFees = gasFee + jitoTip

  // Calculate fee-aware PnL const totalCost = solIn + totalFees const netProfit = solOut - totalCost const pnl = totalCost > 0 ? (netProfit / totalCost) * 100 : -100

  await db.run(
    `
    INSERT INTO trades (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      tokenAddress,
      JSON.stringify(txIds),
      JSON.stringify(wallets),
      solIn,
      solOut,
      pnl,
      totalFees,
      gasFee,
      jitoTip,
    ],
  )

  await db.close()
}

// Initialize table on module loadinitializePnLTable().catch(console.error)
