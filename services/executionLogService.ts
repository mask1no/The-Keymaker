// Defer sqlite imports to runtime to avoid native bindings during unit tests
// and to prevent loading on mere import.
// Do not import sqlite3 at module scope.
import { open } from 'sqlite'
import path from 'path'

interface BundleExecution {
  bundleId?: string
  slot: number
  signatures: string[]
  status: 'success' | 'partial' | 'failed'
  successCount: number
  failureCount: number
  usedJito: boolean
  executionTime: number
}

interface TokenLaunch {
  tokenAddress: string
  name: string
  symbol: string
  platform: string
  supply: string
  decimals: number
  launcherWallet: string
  transactionSignature: string
  liquidityPoolAddress?: string
}

interface FundingEvent {
  fromWallet: string
  toWallets: string[]
  amounts: number[]
  totalAmount: number
  transactionSignatures: string[]
}

interface SellEvent {
  wallet: string
  tokenAddress: string
  amountSold: string
  solEarned: number
  marketCap?: number
  profitPercentage?: number
  transactionSignature: string
}

interface PnLRecord {
  wallet: string
  tokenAddress: string
  entryPrice: number
  exitPrice: number
  solInvested: number
  solReturned: number
  profitLoss: number
  profitPercentage: number
  holdTime: number // in seconds
}

async function getDb() {
  const sqlite3 = (await import('sqlite3')).default
  return open({
    filename: path.join(process.cwd(), 'data', 'analytics.db'),
    driver: sqlite3.Database,
  })
}

async function initializeTables() {
  const db = await getDb()

  // Bundle executions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bundle_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id TEXT,
      slot INTEGER NOT NULL,
      signatures TEXT NOT NULL,
      status TEXT NOT NULL,
      success_count INTEGER NOT NULL,
      failure_count INTEGER NOT NULL,
      used_jito BOOLEAN NOT NULL,
      execution_time INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Token launches table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_launches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      platform TEXT NOT NULL,
      supply TEXT NOT NULL,
      decimals INTEGER NOT NULL,
      launcher_wallet TEXT NOT NULL,
      transaction_signature TEXT NOT NULL,
      liquidity_pool_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Funding events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS funding_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_wallet TEXT NOT NULL,
      to_wallets TEXT NOT NULL,
      amounts TEXT NOT NULL,
      total_amount REAL NOT NULL,
      transaction_signatures TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sell events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sell_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_sold TEXT NOT NULL,
      sol_earned REAL NOT NULL,
      market_cap REAL,
      profit_percentage REAL,
      transaction_signature TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // PnL records table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pnl_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL,
      token_address TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL NOT NULL,
      sol_invested REAL NOT NULL,
      sol_returned REAL NOT NULL,
      profit_loss REAL NOT NULL,
      profit_percentage REAL NOT NULL,
      hold_time INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Execution logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      action TEXT NOT NULL,
      status TEXT,
      details TEXT,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.close()
}

export async function logBundleExecution(execution: BundleExecution) {
  const db = await getDb()

  await db.run(
    `
    INSERT INTO bundle_executions (
      bundle_id, slot, signatures, status, success_count, 
      failure_count, used_jito, execution_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      execution.bundleId || null,
      execution.slot,
      JSON.stringify(execution.signatures),
      execution.status,
      execution.successCount,
      execution.failureCount,
      execution.usedJito ? 1 : 0,
      execution.executionTime,
    ],
  )

  await db.close()
}

export async function logTokenLaunch(launch: TokenLaunch) {
  const db = await getDb()

  await db.run(
    `
    INSERT INTO token_launches (
      token_address, name, symbol, platform, supply, decimals,
      launcher_wallet, transaction_signature, liquidity_pool_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      launch.tokenAddress,
      launch.name,
      launch.symbol,
      launch.platform,
      launch.supply,
      launch.decimals,
      launch.launcherWallet,
      launch.transactionSignature,
      launch.liquidityPoolAddress || null,
    ],
  )

  await db.close()
}

export async function logFundingEvent(funding: FundingEvent) {
  const db = await getDb()

  await db.run(
    `
    INSERT INTO funding_events (
      from_wallet, to_wallets, amounts, total_amount, transaction_signatures
    ) VALUES (?, ?, ?, ?, ?)
  `,
    [
      funding.fromWallet,
      JSON.stringify(funding.toWallets),
      JSON.stringify(funding.amounts),
      funding.totalAmount,
      JSON.stringify(funding.transactionSignatures),
    ],
  )

  await db.close()
}

export async function logSellEvent(sell: SellEvent) {
  const db = await getDb()

  await db.run(
    `
    INSERT INTO sell_events (
      wallet, token_address, amount_sold, sol_earned,
      market_cap, profit_percentage, transaction_signature
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      sell.wallet,
      sell.tokenAddress,
      sell.amountSold,
      sell.solEarned,
      sell.marketCap || null,
      sell.profitPercentage || null,
      sell.transactionSignature,
    ],
  )

  await db.close()
}

export async function logPnL(pnl: PnLRecord) {
  const db = await getDb()

  await db.run(
    `
    INSERT INTO pnl_records (
      wallet, token_address, entry_price, exit_price,
      sol_invested, sol_returned, profit_loss, profit_percentage, hold_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      pnl.wallet,
      pnl.tokenAddress,
      pnl.entryPrice,
      pnl.exitPrice,
      pnl.solInvested,
      pnl.solReturned,
      pnl.profitLoss,
      pnl.profitPercentage,
      pnl.holdTime,
    ],
  )

  await db.close()
}

export async function getExecutionHistory(limit = 100) {
  const db = await getDb()

  const executions = await db.all(
    `
    SELECT * FROM bundle_executions 
    ORDER BY created_at DESC 
    LIMIT ?
  `,
    limit,
  )

  await db.close()
  return executions
}

export async function getPnLHistory(wallet?: string, limit = 100) {
  const db = await getDb()

  let query = 'SELECT * FROM pnl_records'
  const params: (string | number | boolean)[] = []

  if (wallet) {
    query += ' WHERE wallet = ?'
    params.push(wallet)
  }

  query += ' ORDER BY created_at DESC LIMIT ?'
  params.push(limit)

  const records = await db.all(query, params)

  await db.close()
  return records
}

// New types and functions for LogsPanel
export interface ExecutionLog {
  id: string
  timestamp: number
  action: string
  status?: 'success' | 'failed' | 'pending'
  details?: any
  error?: string
}

export async function logEvent(action: string, details?: any) {
  const db = await getDb()
  const timestamp = Date.now()
  const id = `${action}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`

  await db.run(
    'INSERT INTO execution_logs (id, timestamp, action, status, details) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      timestamp,
      action,
      details?.status || 'success',
      JSON.stringify(details),
    ],
  )
}

export async function getExecutionLogs(): Promise<ExecutionLog[]> {
  const db = await getDb()

  const logs = await db.all(
    'SELECT * FROM execution_logs ORDER BY timestamp DESC LIMIT 1000',
  )

  return logs.map((log: any) => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : undefined,
  }))
}

export async function clearLogs() {
  const db = await getDb()
  await db.run('DELETE FROM execution_logs')
}

export async function exportExecutionLog(format: 'json' | 'txt' = 'json') {
  const db = await getDb()

  const data = {
    bundleExecutions: await db.all(
      'SELECT * FROM bundle_executions ORDER BY created_at DESC',
    ),
    tokenLaunches: await db.all(
      'SELECT * FROM token_launches ORDER BY created_at DESC',
    ),
    fundingEvents: await db.all(
      'SELECT * FROM funding_events ORDER BY created_at DESC',
    ),
    sellEvents: await db.all(
      'SELECT * FROM sell_events ORDER BY created_at DESC',
    ),
    pnlRecords: await db.all(
      'SELECT * FROM pnl_records ORDER BY created_at DESC',
    ),
  }

  await db.close()

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  } else {
    let text = 'EXECUTION LOG EXPORT\n'
    text += '===================\n\n'

    text += 'BUNDLE EXECUTIONS\n'
    text += '-----------------\n'
    data.bundleExecutions.forEach((exec) => {
      text += `[${exec.created_at}] Slot: ${exec.slot}, Status: ${exec.status}, Success: ${exec.success_count}/${exec.success_count + exec.failure_count}\n`
    })

    text += '\n\nTOKEN LAUNCHES\n'
    text += '--------------\n'
    data.tokenLaunches.forEach((launch) => {
      text += `[${launch.created_at}] ${launch.name} (${launch.symbol}) on ${launch.platform} - ${launch.token_address}\n`
    })

    text += '\n\nPnL RECORDS\n'
    text += '-----------\n'
    data.pnlRecords.forEach((pnl) => {
      text += `[${pnl.created_at}] ${pnl.wallet.slice(0, 8)}... - P/L: ${pnl.profit_loss.toFixed(4)} SOL (${pnl.profit_percentage.toFixed(2)}%)\n`
    })

    return text
  }
}

// Initialize tables unless running tests
if (process.env.NODE_ENV !== 'test') {
  initializeTables().catch(console.error)
}
