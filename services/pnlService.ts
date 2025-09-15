import 'server-only'
import { Connection } from '@solana/web3.js'
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite' // Dynamic imports belowimport { getTokenPrice } from './jupiterService'

interface PnLEntry {
  wallet: stringtokenAddress: stringaction: 'buy' | 'sell'
  solAmount: numbertokenAmount: numberprice: numbertimestamp: numberfees?: numbergas_fee?: numberjito_tip?: number
}

export interface WalletPnL {
  wallet: stringtotalInvested: numbertotalReturned: numbernetPnL: numberpnlPercentage: numbertrades: numbertotalGasFees: numbertotalJitoTips: number
}

interface TokenPnL {
  tokenAddress: stringbuyAmount: numbersellAmount: numberavgBuyPrice: numberavgSellPrice: numberrealizedPnL: numberunrealizedPnL: number
}

async function getDb() {
  try {
    const sqlite3 = (await import('sqlite3')).defaultconst { open } = await import('sqlite')
    const path = (await import('path')).defaultreturn await open({
      filename: path.join(process.cwd(), 'data', 'analytics.db'),
      driver: sqlite3.Database,
    })
  } catch {
    return {
      exec: async () => undefined,
      run: async () => undefined,
      all: async () => [] as any[],
      close: async () => undefined,
    }
  }
}

// Initialize PnL tracking tableasync function initializePnLTable() {
  const db = await getDb()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pnl_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL,
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

  // Create indices for performanceawait db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pnl_wallet ON pnl_tracking(wallet);
    CREATE INDEX IF NOT EXISTS idx_pnl_token ON pnl_tracking(token_address);
    CREATE INDEX IF NOT EXISTS idx_pnl_timestamp ON pnl_tracking(timestamp);
  `)

  await db.close()
}

// Track a buy transaction with fee awarenessexport async function trackBuy(
  wallet: string,
  tokenAddress: string,
  solSpent: number,
  tokenReceived: number,
  fees: { gas?: number; jito?: number } = {},
): Promise<void> {
  const db = await getDb()
  const price = solSpent / tokenReceivedconst gasFee = fees.gas || 0
  const jitoTip = fees.jito || 0
  const totalFees = gasFee + jitoTipawait db.run(
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

// Track a sell transaction with fee awarenessexport async function trackSell(
  wallet: string,
  tokenAddress: string,
  solReceived: number,
  tokenSold: number,
  fees: { gas?: number; jito?: number } = {},
): Promise<void> {
  const db = await getDb()
  const price = solReceived / tokenSoldconst gasFee = fees.gas || 0
  const jitoTip = fees.jito || 0
  const totalFees = gasFee + jitoTipawait db.run(
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

// Get PnL for a specific wallet with fee awarenessexport async function getWalletPnL(wallet: string): Promise<WalletPnL> {
  const db = await getDb()

  const entries = await db.all<any[]>(
    `
    SELECT * FROM pnl_tracking WHERE wallet = ? ORDER BY timestamp
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

  // Calculate fee-aware PnLconst totalFees = totalGasFees + totalJitoTipsconst totalCost = totalInvested + totalFeesconst netPnL = totalReturned - totalCostconst pnlPercentage = totalCost > 0 ? (netPnL / totalCost) * 100 : 0

  await db.close()

  return {
    wallet,
    totalInvested: totalCost, // Include fees in total investedtotalReturned,
    netPnL,
    pnlPercentage,
    trades: entries.length,
    totalGasFees,
    totalJitoTips,
  }
}

// Get PnL for all walletsexport async function getAllWalletsPnL(): Promise<WalletPnL[]> {
  const db = await getDb()

  const wallets = await db.all<{ wallet: string }[]>(`
    SELECT DISTINCT wallet FROM pnl_tracking
  `)

  await db.close()

  const pnlData = await Promise.all(wallets.map((w) => getWalletPnL(w.wallet)))

  return pnlData
}

// Get PnL for specific token across all walletsexport async function getTokenPnL(
  tokenAddress: string,
  connection?: Connection,
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

  // Calculate unrealized P&L if we have unsold tokenslet unrealizedPnL = 0
  const unsoldTokens = totalBought - totalSoldif (unsoldTokens > 0 && connection) {
    try {
      const currentPrice = await getTokenPrice(tokenAddress, 'WSOL')
      unrealizedPnL = currentPrice * unsoldTokens - avgBuyPrice * unsoldTokens
    } catch (error) {
      console.error('Failed to get current price for unrealized PnL:', error)
    }
  }

  await db.close()

  return {
    tokenAddress,
    buyAmount: totalBought,
    sellAmount: totalSold,
    avgBuyPrice,
    avgSellPrice,
    realizedPnL,
    unrealizedPnL,
  }
}

// Get session PnL (last 24 hours)
export async function getSessionPnL(): Promise<{
  totalPnL: numberpnlPercentage: numbertotalVolume: numberprofitableWallets: numbertotalWallets: number
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

  // Group by walletconst walletData = new Map<string, { invested: number; returned: number }>()

  entries.forEach((entry) => {
    const current = walletData.get(entry.wallet) || { invested: 0, returned: 0 }

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
    const pnl = data.returned - data.investedtotalPnL += pnltotalInvested += data.investedtotalVolume += data.invested + data.returnedif (pnl > 0) profitableWallets++
  })

  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return {
    totalPnL,
    pnlPercentage,
    totalVolume,
    profitableWallets,
    totalWallets: walletData.size,
  }
}

// Export PnL data as JSONexport async function exportPnLData(
  format: 'json' | 'csv' = 'json',
): Promise<string> {
  const [walletPnL, sessionPnL] = await Promise.all([
    getAllWalletsPnL(),
    getSessionPnL(),
  ])

  const data = {
    timestamp: new Date().toISOString(),
    session: sessionPnL,
    wallets: walletPnL,
  }

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  } else {
    // CSV formatlet csv =
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

// Save completed trade to trades table with fee awarenessexport async function saveCompletedTrade(
  tokenAddress: string,
  txIds: string[],
  wallets: string[],
  solIn: number,
  solOut: number,
  fees: { gas?: number; jito?: number } = {},
): Promise<void> {
  const db = await getDb()

  const gasFee = fees.gas || 0
  const jitoTip = fees.jito || 0
  const totalFees = gasFee + jitoTip

  // Calculate fee-aware PnLconst totalCost = solIn + totalFeesconst netProfit = solOut - totalCostconst pnl = totalCost > 0 ? (netProfit / totalCost) * 100 : -100

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
