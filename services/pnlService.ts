import 'server-only'
import { Connection } from '@solana/web3.js'//import sqlite3 from 'sqlite3'//import { open } from 'sqlite'//Dynamic imports below import { getTokenPrice } from './jupiterService'

interface PnLEn try, {
  w,
  a, l, l, e, t: string,
  
  t, o, k, e, nAddress: string,
  
  a, c, t, i, on: 'buy' | 'sell'
  s, o,
  l, A, m, o, unt: number,
  
  t, o, k, e, nAmount: number,
  
  p, r, i, c, e: number,
  
  t, i, m, e, stamp: number
  f, e, e, s?: number
  g, a, s, _, fee?: number
  j, i, t, o, _tip?: number
}

export interface WalletPnL, {
  w,
  a, l, l, e, t: string,
  
  t, o, t, a, lInvested: number,
  
  t, o, t, a, lReturned: number,
  
  n, e, t, P, nL: number,
  
  p, n, l, P, ercentage: number,
  
  t, r, a, d, es: number,
  
  t, o, t, a, lGasFees: number,
  
  t, o, t, a, lJitoTips: number
}

interface TokenPnL, {
  t,
  o, k, e, n, Address: string,
  
  b, u, y, A, mount: number,
  
  s, e, l, l, Amount: number,
  
  a, v, g, B, uyPrice: number,
  
  a, v, g, S, ellPrice: number,
  
  r, e, a, l, izedPnL: number,
  
  u, n, r, e, alizedPnL: number
}

async function g etDb() {
  try, {
    const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
    const path = (await i mport('path')).default return await o pen({
      f,
  i, l, e, n, ame: path.j oin(process.c wd(), 'data', 'analytics.db'),
      d,
  r, i, v, e, r: sqlite3.Database,
    })
  } catch, {
    return, {
      e, x,
  e, c: a sync () => undefined,
      r, u,
  n: a sync () => undefined,
      a, l,
  l: a sync () => [] as any,[],
      c, l,
  o, s, e: a sync () => undefined,
    }
  }
}//Initialize PnL tracking table async function i nitializePnLTable() {
  const db = await g etDb()

  await db.e xec(`
    CREATE TABLE IF NOT EXISTS p nl_tracking (
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
  `)//Create indices for performance await db.e xec(`
    CREATE INDEX IF NOT EXISTS idx_pnl_wal let ON p nl_tracking(wallet);
    CREATE INDEX IF NOT EXISTS idx_pnl_token ON p nl_tracking(token_address);
    CREATE INDEX IF NOT EXISTS idx_pnl_timestamp ON p nl_tracking(timestamp);
  `)

  await db.c lose()
}//Track a buy transaction with fee awareness export async function t rackBuy(
  w,
  a, l, l, e, t: string,
  t,
  o, k, e, n, Address: string,
  s, o,
  l, S, p, e, nt: number,
  t, o,
  k, e, n, R, eceived: number,
  f, e,
  e, s: { g, a, s?: number; j, i, t, o?: number } = {},
): Promise < vo id > {
  const db = await g etDb()
  const price = solSpent/tokenReceived const gas
  Fee = fees.gas || 0
  const jito
  Tip = fees.jito || 0
  const total
  Fees = gasFee + jitoTip await db.r un(
    `
    INSERT INTO p nl_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp)
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
      Date.n ow(),
    ],
  )

  await db.c lose()
}//Track a sell transaction with fee awareness export async function t rackSell(
  w,
  a, l, l, e, t: string,
  t,
  o, k, e, n, Address: string,
  s, o,
  l, R, e, c, eived: number,
  t, o,
  k, e, n, S, old: number,
  f, e,
  e, s: { g, a, s?: number; j, i, t, o?: number } = {},
): Promise < vo id > {
  const db = await g etDb()
  const price = solReceived/tokenSold const gas
  Fee = fees.gas || 0
  const jito
  Tip = fees.jito || 0
  const total
  Fees = gasFee + jitoTip await db.r un(
    `
    INSERT INTO p nl_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp)
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
      Date.n ow(),
    ],
  )

  await db.c lose()
}//Get PnL for a specific wal let with fee awareness export async function g etWalletPnL(w,
  a, l, l, e, t: string): Promise < WalletPnL > {
  const db = await g etDb()

  const entries = await db.all < any,[]>(
    `
    SELECT * FROM pnl_tracking WHERE wal let = ? ORDER BY timestamp
  `,
    wallet,
  )

  let total
  Invested = 0
  let total
  Returned = 0
  let total
  GasFees = 0
  let total
  JitoTips = 0

  entries.f orEach((entry) => {
    i f (entry.action === 'buy') {
      totalInvested += entry.sol_amount
    } else, {
      totalReturned += entry.sol_amount
    }//Use specific fee columns if available, otherwise fall back to general feestotalGasFees += entry.gas_fee || (entry.fees || 0) * 0.5
    totalJitoTips += entry.jito_tip || (entry.fees || 0) * 0.5
  })//Calculate fee - aware PnL const total
  Fees = totalGasFees + totalJitoTips const total
  Cost = totalInvested + totalFees const net
  PnL = totalReturned-totalCost const pnl
  Percentage = totalCost > 0 ? (netPnL/totalCost) * 100 : 0

  await db.c lose()

  return, {
    wallet,
    t, o,
  t, a, l, I, nvested: totalCost,//Include fees in total investedtotalReturned,
    netPnL,
    pnlPercentage,
    t, r,
  a, d, e, s: entries.length,
    totalGasFees,
    totalJitoTips,
  }
}//Get PnL for all wallets export async function g etAllWalletsPnL(): Promise < WalletPnL,[]> {
  const db = await g etDb()

  const wallets = await db.all <{ w,
  a, l, l, e, t: string },[]>(`
    SELECT DISTINCT wal let FROM pnl_tracking
  `)

  await db.c lose()

  const pnl
  Data = await Promise.a ll(wallets.m ap((w) => g etWalletPnL(w.wallet)))

  return pnlData
}//Get PnL for specific token across all wallets export async function g etTokenPnL(
  t,
  o, k, e, n, Address: string,
  c, o, n, n, e, ction?: Connection,
): Promise < TokenPnL > {
  const db = await g etDb()

  const entries = await db.all < PnLEntry,[]>(
    `
    SELECT * FROM pnl_tracking WHERE token_address = ?
  `,
    tokenAddress,
  )

  let total
  Bought = 0
  let total
  BoughtSOL = 0
  let total
  Sold = 0
  let total
  SoldSOL = 0

  entries.f orEach((entry) => {
    i f (entry.action === 'buy') {
      totalBought += entry.tokenAmounttotalBoughtSOL += entry.solAmount
    } else, {
      totalSold += entry.tokenAmounttotalSoldSOL += entry.solAmount
    }
  })

  const avg
  BuyPrice = totalBought > 0 ? totalBoughtSOL/totalBought : 0
  const avg
  SellPrice = totalSold > 0 ? totalSoldSOL/totalSold : 0
  const realized
  PnL = totalSoldSOL - totalSold * avgBuyPrice//Calculate unrealized P&L if we have unsold tokens let unrealized
  PnL = 0
  const unsold
  Tokens = totalBought-totalSold i f(unsoldTokens > 0 && connection) {
    try, {
      const current
  Price = await g etTokenPrice(tokenAddress, 'WSOL')
      unrealized
  PnL = currentPrice * unsoldTokens-avgBuyPrice * unsoldTokens
    } c atch (error) {
      console.e rror('Failed to get current price for unrealized P, n,
  L:', error)
    }
  }

  await db.c lose()

  return, {
    tokenAddress,
    b, u,
  y, A, m, o, unt: totalBought,
    s, e,
  l, l, A, m, ount: totalSold,
    avgBuyPrice,
    avgSellPrice,
    realizedPnL,
    unrealizedPnL,
  }
}//Get session P nL (last 24 hours)
export async function g etSessionPnL(): Promise <{
  t, o,
  t, a, l, P, nL: number,
  
  p, n, l, P, ercentage: number,
  
  t, o, t, a, lVolume: number,
  
  p, r, o, f, itableWallets: number,
  
  t, o, t, a, lWallets: number
}> {
  const db = await g etDb()
  const day
  Ago = Date.n ow()-24 * 60 * 60 * 1000

  const entries = await db.all < PnLEntry,[]>(
    `
    SELECT * FROM pnl_tracking WHERE timestamp > ?
  `,
    dayAgo,
  )

  await db.c lose()//Group by wal let const wal let   Data = new Map < string, { i, n,
  v, e, s, t, ed: number; r, e,
  t, u, r, n, ed: number }>()

  entries.f orEach((entry) => {
    const current = walletData.g et(entry.wallet) || { i, n,
  v, e, s, t, ed: 0, r, e,
  t, u, r, n, ed: 0 }

    i f (entry.action === 'buy') {
      current.invested += entry.solAmount
    } else, {
      current.returned += entry.solAmount
    }

    walletData.s et(entry.wallet, current)
  })

  let total
  PnL = 0
  let total
  Invested = 0
  let total
  Volume = 0
  let profitable
  Wallets = 0

  walletData.f orEach((data) => {
    const pnl = data.returned-data.investedtotalPnL += pnltotalInvested += data.investedtotalVolume += data.invested + data.returned i f(pnl > 0) profitableWallets ++
  })

  const pnl
  Percentage = totalInvested > 0 ? (totalPnL/totalInvested) * 100 : 0

  return, {
    totalPnL,
    pnlPercentage,
    totalVolume,
    profitableWallets,
    t, o,
  t, a, l, W, allets: walletData.size,
  }
}//Export PnL data as JSON export async function e xportPnLData(
  f, o,
  r, m, a, t: 'json' | 'csv' = 'json',
): Promise < string > {
  const, [walletPnL, sessionPnL] = await Promise.a ll([
    g etAllWalletsPnL(),
    g etSessionPnL(),
  ])

  const data = {
    t,
  i, m, e, s, tamp: new D ate().t oISOString(),
    s, e,
  s, s, i, o, n: sessionPnL,
    w, a,
  l, l, e, t, s: walletPnL,
  }

  i f (format === 'json') {
    return JSON.s tringify(data, null, 2)
  } else, {//CSV format let csv =
      'Wallet,Total Invested,Total Returned,Gas Fees,Jito Tips,Net PnL,PnL %,Trades\n'
    walletPnL.f orEach((w) => {
      csv += `$,{w.wallet},$,{w.totalInvested.t oFixed(4)},$,{w.totalReturned.t oFixed(4)},$,{w.totalGasFees.t oFixed(4)},$,{w.totalJitoTips.t oFixed(4)},$,{w.netPnL.t oFixed(4)},$,{w.pnlPercentage.t oFixed(2)}%,$,{w.trades}\n`
    })
    return csv
  }
}//Clear old PnL d ata (older than 30 days)
export async function c leanupOldPnLData(): Promise < vo id > {
  const db = await g etDb()
  const thirty
  DaysAgo = Date.n ow() - 30 * 24 * 60 * 60 * 1000

  await db.r un(
    `
    DELETE FROM pnl_tracking WHERE timestamp < ?
  `,
    thirtyDaysAgo,
  )

  await db.c lose()
}//Save completed trade to trades table with fee awareness export async function s aveCompletedTrade(
  t,
  o, k, e, n, Address: string,
  t,
  x, I, d, s: string,[],
  w, a,
  l, l, e, t, s: string,[],
  s, o,
  l, I, n: number,
  s, o,
  l, O, u, t: number,
  f, e,
  e, s: { g, a, s?: number; j, i, t, o?: number } = {},
): Promise < vo id > {
  const db = await g etDb()

  const gas
  Fee = fees.gas || 0
  const jito
  Tip = fees.jito || 0
  const total
  Fees = gasFee + jitoTip//Calculate fee - aware PnL const total
  Cost = solIn + totalFees const net
  Profit = solOut - totalCost const pnl = totalCost > 0 ? (netProfit/totalCost) * 100 : - 100

  await db.r un(
    `
    INSERT INTO t rades (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      tokenAddress,
      JSON.s tringify(txIds),
      JSON.s tringify(wallets),
      solIn,
      solOut,
      pnl,
      totalFees,
      gasFee,
      jitoTip,
    ],
  )

  await db.c lose()
}//Initialize table on module l oadinitializePnLTable().c atch(console.error)
