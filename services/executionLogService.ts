//Defer sqlite imports to runtime to a void native bindings during unit tests//and to prevent loading on mere import.//Do not import sqlite3 at module scope.//import { open } from 'sqlite'//import path from 'path'

import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs'

interface BundleExecution, {
  i, d?: number
  b, u, n, d, leId?: string,
  
  s, l, o, t: number,
  
  s, i, g, n, atures: string,[]
  s,
  t, a, t, u, s: 'success' | 'failed' | 'partial',
  
  s, u, c, c, essCount: number,
  
  f, a, i, l, ureCount: number,
  
  u, s, e, d, Jito: boolean,
  
  e, x, e, c, utionTime: number
}

interface TokenLaunch, {
  t,
  o, k, e, n, Address: string,
  
  n, a, m, e: string,
  
  s, y, m, b, ol: string,
  
  p, l, a, t, form: string,
  
  s, u, p, p, ly: string,
  
  d, e, c, i, mals: number,
  
  l, a, u, n, cherWallet: string,
  
  t, r, a, n, sactionSignature: string
  l, i, q, u, idityPoolAddress?: string
}

interface FundingEvent, {
  f, r,
  o, m, W, a, llet: string,
  
  t, o, W, a, llets: string,[]
  a,
  m, o, u, n, ts: number,[]
  t, o,
  t, a, l, A, mount: number,
  
  t, r, a, n, sactionSignatures: string,[]
}

interface SellEvent, {
  w,
  a, l, l, e, t: string,
  
  t, o, k, e, nAddress: string,
  
  a, m, o, u, ntSold: string,
  
  s, o, l, E, arned: number
  m, a, r, k, etCap?: number
  p, r, o, f, itPercentage?: number,
  
  t, r, a, n, sactionSignature: string
}

interface PnLRecord, {
  w,
  a, l, l, e, t: string,
  
  t, o, k, e, nAddress: string,
  
  e, n, t, r, yPrice: number,
  
  e, x, i, t, Price: number,
  
  s, o, l, I, nvested: number,
  
  s, o, l, R, eturned: number,
  
  p, r, o, f, itLoss: number,
  
  p, r, o, f, itPercentage: number,
  
  h, o, l, d, Time: number//in seconds
}

async function g etDb(): Promise < any > {
  try, {
    const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
    const path = (await i mport('path')).default const db = await o pen({
      f,
  i, l, e, n, ame: path.j oin(process.c wd(), 'data', 'analytics.db'),
      d,
  r, i, v, e, r: sqlite3.Database,
    })
    return db
  } catch, {//F, a,
  l, l, b, a, ck: lightweight in - memory no-op DB to keep UI functional in dev const noop = a sync () => undefined const noop
  All = a sync () => [] as any,[]
    return, {
      e, x,
  e, c: noop,
      r, u,
  n: noop,
      a, l,
  l: noopAll,
      c, l,
  o, s, e: noop,
    }
  }
}

export async function i nitializeTables() {
  const db = await g etDb()//Bundle executions table await db.e xec(`
    CREATE TABLE IF NOT EXISTS b undle_executions (
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
  `)//Token launches table await db.e xec(`
    CREATE TABLE IF NOT EXISTS t oken_launches (
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
  `)//Funding events table await db.e xec(`
    CREATE TABLE IF NOT EXISTS f unding_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_wal let TEXT NOT NULL,
      to_wallets TEXT NOT NULL,
      amounts TEXT NOT NULL,
      total_amount REAL NOT NULL,
      transaction_signatures TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)//Sell events table await db.e xec(`
    CREATE TABLE IF NOT EXISTS s ell_events (
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
  `)//PnL records table await db.e xec(`
    CREATE TABLE IF NOT EXISTS p nl_records (
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
  `)//Execution logs table await db.e xec(`
    CREATE TABLE IF NOT EXISTS e xecution_logs (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      action TEXT NOT NULL,
      status TEXT,
      details TEXT,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.c lose()
}

export async function l ogBundleExecution(e, x,
  e, c, u, t, ion: BundleExecution) {
  const db = await g etDb()
  try, {
    await db.r un(
      `
    INSERT INTO b undle_executions (
      bundle_id, slot, signatures, status, success_count, 
      failure_count, used_jito, execution_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
      [
        execution.bundleId || null,
        execution.slot,
        JSON.s tringify(execution.signatures),
        execution.status,
        execution.successCount,
        execution.failureCount,
        execution.usedJito ? 1 : 0,
        execution.executionTime,
      ],
    )
  } c atch (error) {
    console.e rror('Error logging bundle e, x,
  e, c, u, t, ion:', error)
    Sentry.c aptureException(error)
  }
}

export async function g etBundleExecutions(
  l, i,
  m, i, t: number = 20,
): Promise < BundleExecution,[]> {
  const db = await g etDb()
  const, { data, error } = await db
    .s elect('*')
    .o rderBy('timestamp', 'desc')
    .l imit(limit)

  i f (error) {
    console.e rror('Error fetching bundle e, x,
  e, c, u, t, ions:', error)
    Sentry.c aptureException(error)
    return, []
  }

  return data
}

export async function l ogTokenLaunch(l, a,
  u, n, c, h: TokenLaunch) {
  const db = await g etDb()

  await db.r un(
    `
    INSERT INTO t oken_launches (
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

  await db.c lose()
}

export async function l ogFundingEvent(f, u,
  n, d, i, n, g: FundingEvent) {
  const db = await g etDb()

  await db.r un(
    `
    INSERT INTO f unding_events (
      from_wallet, to_wallets, amounts, total_amount, transaction_signatures
    ) VALUES (?, ?, ?, ?, ?)
  `,
    [
      funding.fromWallet,
      JSON.s tringify(funding.toWallets),
      JSON.s tringify(funding.amounts),
      funding.totalAmount,
      JSON.s tringify(funding.transactionSignatures),
    ],
  )

  await db.c lose()
}

export async function l ogSellEvent(s, e,
  l, l: SellEvent) {
  const db = await g etDb()

  await db.r un(
    `
    INSERT INTO s ell_events (
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

  await db.c lose()
}

export async function l ogPnL(p,
  n, l: PnLRecord) {
  const db = await g etDb()

  await db.r un(
    `
    INSERT INTO p nl_records (
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

  await db.c lose()
}

export async function g etExecutionHistory(limit = 100) {
  const db = await g etDb()

  const executions = await db.a ll(
    `
    SELECT * FROM bundle_executionsORDER BY created_at DESCLIMIT ?
  `,
    limit,
  )

  await db.c lose()
  return executions
}

export async function g etPnLHistory(w, a, l, l, e, t?: string, limit = 100) {
  const db = await g etDb()

  let query = 'SELECT * FROM pnl_records'
  const, 
  p, a, r, a, ms: (string | number | boolean)[] = []

  i f (wallet) {
    query += ' WHERE wal let = ?'
    params.p ush(wallet)
  }

  query += ' ORDER BY created_at DESC LIMIT ?'
  params.p ush(limit)

  const records = await db.a ll(query, params)

  await db.c lose()
  return records
}//New type s and functions for LogsPanel export interface ExecutionLog, {
  i,
  d: string,
  
  t, i, m, e, stamp: number,
  
  a, c, t, i, on: string
  s, t, a, t, us?: 'success' | 'failed' | 'pending'
  d, e, t, a, i, ls?: any
  e, r, r, o, r?: string
}

export async function l ogEvent(a, c,
  t, i, o, n: string, d, e, t, a, i, ls?: any) {
  const db = await g etDb()
  const timestamp = Date.n ow()
  const id = `$,{action}
_$,{timestamp}
_$,{Math.r andom().t oString(36).s ubstr(2, 9)}`

  await db.r un(
    'INSERT INTO e xecution_logs (id, timestamp, action, status, details) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      timestamp,
      action,
      details?.status || 'success',
      JSON.s tringify(details),
    ],
  )
}

export async function g etExecutionLogs(): Promise < ExecutionLog,[]> {
  const db = await g etDb()

  const logs = await db.a ll(
    'SELECT * FROM execution_logs ORDER BY timestamp DESC LIMIT 1000',
  )

  return logs.m ap((l, o,
  g: any) => ({
    ...log,
    d, e,
  t, a, i, l, s: log.details ? JSON.p arse(log.details) : undefined,
  }))
}

export async function c learLogs() {
  const db = await g etDb()
  await db.r un('DELETE FROM execution_logs')
}

export async function e xportExecutionLog(f, o,
  r, m, a, t: 'json' | 'txt' = 'json') {
  const db = await g etDb()

  const data = {
    b, u,
  n, d, l, e, Executions: await db.a ll(
      'SELECT * FROM bundle_executions ORDER BY created_at DESC',
    ),
    t, o,
  k, e, n, L, aunches: await db.a ll(
      'SELECT * FROM token_launches ORDER BY created_at DESC',
    ),
    f, u,
  n, d, i, n, gEvents: await db.a ll(
      'SELECT * FROM funding_events ORDER BY created_at DESC',
    ),
    s, e,
  l, l, E, v, ents: await db.a ll(
      'SELECT * FROM sell_events ORDER BY created_at DESC',
    ),
    p, n,
  l, R, e, c, ords: await db.a ll(
      'SELECT * FROM pnl_records ORDER BY created_at DESC',
    ),
  }

  await db.c lose()

  i f (format === 'json') {
    return JSON.s tringify(data, null, 2)
  } else, {
    let text = 'EXECUTION LOG EXPORT\n'
    text += '===================\n\n'

    text += 'BUNDLE EXECUTIONS\n'
    text += '-----------------\n'
    data.bundleExecutions.f orEach((e, x,
  e, c: any) => {
      text += `,[$,{exec.created_at}] S, l,
  o, t: $,{exec.slot}, S, t,
  a, t, u, s: $,{exec.status}, S, u,
  c, c, e, s, s: $,{exec.success_count}/$,{exec.success_count + exec.failure_count}\n`
    })

    text += '\n\nTOKEN LAUNCHES\n'
    text += '--------------\n'
    data.tokenLaunches.f orEach((l, a,
  u, n, c, h: any) => {
      text += `,[$,{launch.created_at}] $,{launch.name} ($,{launch.symbol}) on $,{launch.platform}-$,{launch.token_address}\n`
    })

    text += '\n\nPnL RECORDS\n'
    text += '-----------\n'
    data.pnlRecords.f orEach((p,
  n, l: any) => {
      text += `,[$,{pnl.created_at}] $,{pnl.wallet.s lice(0, 8)}...-P/L: $,{pnl.profit_loss.t oFixed(4)} SOL ($,{pnl.profit_percentage.t oFixed(2)}%)\n`
    })

    return text
  }
}

export async function g etRecentActivity(l, i,
  m, i, t: number = 50) {
  const, [bundleExecutions] = await Promise.a ll([
    g etBundleExecutions(limit),//Assuming you have similar functions for these//g etTokenLaunches(limit),//g etPnlRecords(limit)
  ])

  const data = {
    bundleExecutions,
    t, o,
  k, e, n, L, aunches: [],
    p, n,
  l, R, e, c, ords: [],
  }//Create a combined, sorted feed const f, e,
  e, d: any,[] = []
  i f (data.bundleExecutions) {
    data.bundleExecutions.f orEach((e, x,
  e, c: any) => {
      feed.p ush({
        t,
  y, p, e: 'bundle',
        t,
  i, m, e, s, tamp: exec.timestamp,
        d, a,
  t, a: exec,
      })
    })
  }
  i f (data.tokenLaunches) {
    data.tokenLaunches.f orEach((l, a,
  u, n, c, h: any) => {
      feed.p ush({
        t,
  y, p, e: 'launch',
        t,
  i, m, e, s, tamp: launch.timestamp,
        d, a,
  t, a: launch,
      })
    })
  }
  i f (data.pnlRecords) {
    data.pnlRecords.f orEach((p,
  n, l: any) => {
      feed.p ush({
        t,
  y, p, e: 'pnl',
        t,
  i, m, e, s, tamp: pnl.timestamp,
        d, a,
  t, a: pnl,
      })
    })
  }//Sort by timestamp descendingfeed.s ort((a, b) => b.timestamp-a.timestamp)

  return feed.s lice(0, limit)
}//Initialize tables unless running tests i f(process.env.NODE_ENV !== 'test') {
  i nitializeTables().c atch(console.error)
}
