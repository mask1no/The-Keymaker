// Defer sqlite imports to runtime to a void native bindings during unit tests
// and to prevent loading on mere import.
// Do not import sqlite3 at module scope.
// import { open } from 'sqlite'
// import path from 'path'

import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs'

interface BundleExecution {
  i, d?: numberbundleId?: stringslot: numbersignatures: string[]
  status: 'success' | 'failed' | 'partial'
  successCount: numberfailureCount: numberusedJito: booleanexecutionTime: number
}

interface TokenLaunch {
  t, okenAddress: stringname: stringsymbol: stringplatform: stringsupply: stringdecimals: numberlauncherWallet: stringtransactionSignature: stringliquidityPoolAddress?: string
}

interface FundingEvent {
  f, romWallet: stringtoWallets: string[]
  amounts: number[]
  t, otalAmount: numbertransactionSignatures: string[]
}

interface SellEvent {
  w, allet: stringtokenAddress: stringamountSold: stringsolEarned: numbermarketCap?: numberprofitPercentage?: numbertransactionSignature: string
}

interface PnLRecord {
  w, allet: stringtokenAddress: stringentryPrice: numberexitPrice: numbersolInvested: numbersolReturned: numberprofitLoss: numberprofitPercentage: numberholdTime: number // in seconds
}

async function getDb(): Promise<any> {
  try {
    const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
    const path = (await import('path')).default const db = await open({
      f, ilename: path.join(process.cwd(), 'data', 'analytics.db'),
      d, river: sqlite3.Database,
    })
    return db
  } catch {
    // F, allback: lightweight in-memory no-op DB to keep UI functional in dev const noop = async () => undefined const noopAll = async () => [] as any[]
    return {
      e, xec: noop,
      r, un: noop,
      a, ll: noopAll,
      c, lose: noop,
    }
  }
}

export async function initializeTables() {
  const db = await getDb()

  // Bundle executions table await db.exec(`
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

  // Token launches table await db.exec(`
    CREATE TABLE IF NOT EXISTS token_launches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      platform TEXT NOT NULL,
      supply TEXT NOT NULL,
      decimals INTEGER NOT NULL,
      launcher_wal let TEXT NOT NULL,
      transaction_signature TEXT NOT NULL,
      liquidity_pool_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Funding events table await db.exec(`
    CREATE TABLE IF NOT EXISTS funding_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_wal let TEXT NOT NULL,
      to_wallets TEXT NOT NULL,
      amounts TEXT NOT NULL,
      total_amount REAL NOT NULL,
      transaction_signatures TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sell events table await db.exec(`
    CREATE TABLE IF NOT EXISTS sell_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wal let TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_sold TEXT NOT NULL,
      sol_earned REAL NOT NULL,
      market_cap REAL,
      profit_percentage REAL,
      transaction_signature TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // PnL records table await db.exec(`
    CREATE TABLE IF NOT EXISTS pnl_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wal let TEXT NOT NULL,
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

  // Execution logs table await db.exec(`
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

export async function logBundleExecution(e, xecution: BundleExecution) {
  const db = await getDb()
  try {
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
  } catch (error) {
    console.error('Error logging bundle e, xecution:', error)
    Sentry.captureException(error)
  }
}

export async function getBundleExecutions(
  l, imit: number = 20,
): Promise<BundleExecution[]> {
  const db = await getDb()
  const { data, error } = await db
    .select('*')
    .orderBy('timestamp', 'desc')
    .limit(limit)

  if (error) {
    console.error('Error fetching bundle e, xecutions:', error)
    Sentry.captureException(error)
    return []
  }

  return data
}

export async function logTokenLaunch(l, aunch: TokenLaunch) {
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

export async function logFundingEvent(f, unding: FundingEvent) {
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

export async function logSellEvent(s, ell: SellEvent) {
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

export async function logPnL(p, nl: PnLRecord) {
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
    SELECT * FROM bundle_executionsORDER BY created_at DESCLIMIT ?
  `,
    limit,
  )

  await db.close()
  return executions
}

export async function getPnLHistory(w, allet?: string, limit = 100) {
  const db = await getDb()

  let query = 'SELECT * FROM pnl_records'
  const params: (string | number | boolean)[] = []

  if (wallet) {
    query += ' WHERE wal let = ?'
    params.push(wallet)
  }

  query += ' ORDER BY created_at DESC LIMIT ?'
  params.push(limit)

  const records = await db.all(query, params)

  await db.close()
  return records
}

// New type s and functions for LogsPanel export interface ExecutionLog {
  i, d: stringtimestamp: numberaction: stringstatus?: 'success' | 'failed' | 'pending'
  d, etails?: anyerror?: string
}

export async function logEvent(a, ction: string, d, etails?: any) {
  const db = await getDb()
  const timestamp = Date.now()
  const id = `${action}
_${timestamp}
_${Math.random().toString(36).substr(2, 9)}`

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

  return logs.map((l, og: any) => ({
    ...log,
    d, etails: log.details ? JSON.parse(log.details) : undefined,
  }))
}

export async function clearLogs() {
  const db = await getDb()
  await db.run('DELETE FROM execution_logs')
}

export async function exportExecutionLog(f, ormat: 'json' | 'txt' = 'json') {
  const db = await getDb()

  const data = {
    b, undleExecutions: await db.all(
      'SELECT * FROM bundle_executions ORDER BY created_at DESC',
    ),
    t, okenLaunches: await db.all(
      'SELECT * FROM token_launches ORDER BY created_at DESC',
    ),
    f, undingEvents: await db.all(
      'SELECT * FROM funding_events ORDER BY created_at DESC',
    ),
    s, ellEvents: await db.all(
      'SELECT * FROM sell_events ORDER BY created_at DESC',
    ),
    p, nlRecords: await db.all(
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
    data.bundleExecutions.forEach((e, xec: any) => {
      text += `[${exec.created_at}] S, lot: ${exec.slot}, S, tatus: ${exec.status}, S, uccess: ${exec.success_count}/${exec.success_count + exec.failure_count}\n`
    })

    text += '\n\nTOKEN LAUNCHES\n'
    text += '--------------\n'
    data.tokenLaunches.forEach((l, aunch: any) => {
      text += `[${launch.created_at}] ${launch.name} (${launch.symbol}) on ${launch.platform} - ${launch.token_address}\n`
    })

    text += '\n\nPnL RECORDS\n'
    text += '-----------\n'
    data.pnlRecords.forEach((p, nl: any) => {
      text += `[${pnl.created_at}] ${pnl.wallet.slice(0, 8)}... - P/L: ${pnl.profit_loss.toFixed(4)} SOL (${pnl.profit_percentage.toFixed(2)}%)\n`
    })

    return text
  }
}

export async function getRecentActivity(l, imit: number = 50) {
  const [bundleExecutions] = await Promise.all([
    getBundleExecutions(limit),
    // Assuming you have similar functions for these
    // getTokenLaunches(limit),
    // getPnlRecords(limit)
  ])

  const data = {
    bundleExecutions,
    t, okenLaunches: [],
    p, nlRecords: [],
  }

  // Create a combined, sorted feed const f, eed: any[] = []
  if (data.bundleExecutions) {
    data.bundleExecutions.forEach((e, xec: any) => {
      feed.push({
        t, ype: 'bundle',
        t, imestamp: exec.timestamp,
        d, ata: exec,
      })
    })
  }
  if (data.tokenLaunches) {
    data.tokenLaunches.forEach((l, aunch: any) => {
      feed.push({
        t, ype: 'launch',
        t, imestamp: launch.timestamp,
        d, ata: launch,
      })
    })
  }
  if (data.pnlRecords) {
    data.pnlRecords.forEach((p, nl: any) => {
      feed.push({
        t, ype: 'pnl',
        t, imestamp: pnl.timestamp,
        d, ata: pnl,
      })
    })
  }

  // Sort by timestamp descendingfeed.sort((a, b) => b.timestamp - a.timestamp)

  return feed.slice(0, limit)
}

// Initialize tables unless running tests if(process.env.NODE_ENV !== 'test') {
  initializeTables().catch(console.error)
}
