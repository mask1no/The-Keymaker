//Defer sqlite imports to runtime to a void native bindings during unit tests//and to prevent loading on mere import.//Do not import sqlite3 at module scope.//import { open } from 'sqlite'//import path from 'path' import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs' interface BundleExecution, { i, d?: number b, u, n, d, l, e, Id?: string, s, l, o, t: number, s, i, g, n, a, t, u, res: string,[] s, tatus: 'success' | 'failed' | 'partial', s, u, c, c, e, s, s, Count: number, f, a, i, l, u, r, e, Count: number, u, s, e, d, J, i, t, o: boolean, e, x, e, c, u, t, i, onTime: number
} interface TokenLaunch, { t, o, k, e, n, A, d, d, ress: string, n, a, m, e: string, s, y, m, b, o, l: string, p, l, a, t, f, o, r, m: string, s, u, p, p, l, y: string, d, e, c, i, m, a, l, s: number, l, a, u, n, c, h, e, rWallet: string, t, r, a, n, s, a, c, tionSignature: string l, i, q, u, i, d, ityPoolAddress?: string
} interface FundingEvent, { f, r, o, m, W, a, l, l, e, t: string, t, o, W, a, l, l, e, ts: string,[] a, m, o, u, n, t, s: number,[] t, o, t, a, l, A, m, o, u, nt: number, t, r, a, n, s, a, c, tionSignatures: string,[]
} interface SellEvent, { w, a, l, l, e, t: string, t, o, k, e, n, A, d, dress: string, a, m, o, u, n, t, S, old: string, s, o, l, E, a, r, n, ed: number m, a, r, k, e, t, Cap?: number p, r, o, f, i, t, Percentage?: number, t, r, a, n, s, a, c, tionSignature: string
} interface PnLRecord, { w, a, l, l, e, t: string, t, o, k, e, n, A, d, dress: string, e, n, t, r, y, P, r, ice: number, e, x, i, t, P, r, i, ce: number, s, o, l, I, n, v, e, sted: number, s, o, l, R, e, t, u, rned: number, p, r, o, f, i, t, L, oss: number, p, r, o, f, i, t, P, ercentage: number, h, o, l, d, T, i, m, e: number//in seconds
} async function g e tDb(): Promise <any> {
  try {
  const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite') const path = (await import('path')).default const db = await o p en({ f, i, l, e, n, a, m, e: path.j o in(process.c w d(), 'data', 'analytics.db'), d, r, i, v, e, r: sqlite3.Database }) return db }
} catch, {//F, a, l, l, b, a, c, k: lightweight in - memory no-op DB to keep UI functional in dev const noop = async () => undefined const noop All = async () => [] as any,[] return, { e, x, e, c: noop, r, u, n: noop, a, l, l: noopAll, c, l, o, s, e: noop }
}
}

export async function i n itializeTables() {
  const db = await getDb()//Bundle executions table await db.e x ec(` CREATE TABLE IF NOT EXISTS b u ndle_executions ( id INTEGER PRIMARY KEY AUTOINCREMENT, bundle_id TEXT, slot INTEGER NOT NULL, signatures TEXT NOT NULL, status TEXT NOT NULL, success_count INTEGER NOT NULL, failure_count INTEGER NOT NULL, used_jito BOOLEAN NOT NULL, execution_time INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Token launches table await db.e x ec(` CREATE TABLE IF NOT EXISTS t o ken_launches ( id INTEGER PRIMARY KEY AUTOINCREMENT, token_address TEXT UNIQUE NOT NULL, name TEXT NOT NULL, symbol TEXT NOT NULL, platform TEXT NOT NULL, supply TEXT NOT NULL, decimals INTEGER NOT NULL, launcher_wal let TEXT NOT NULL, transaction_signature TEXT NOT NULL, liquidity_pool_address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Funding events table await db.e x ec(` CREATE TABLE IF NOT EXISTS f u nding_events ( id INTEGER PRIMARY KEY AUTOINCREMENT, from_wal let TEXT NOT NULL, to_wallets TEXT NOT NULL, amounts TEXT NOT NULL, total_amount REAL NOT NULL, transaction_signatures TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Sell events table await db.e x ec(` CREATE TABLE IF NOT EXISTS s e ll_events ( id INTEGER PRIMARY KEY AUTOINCREMENT, wal let TEXT NOT NULL, token_address TEXT NOT NULL, amount_sold TEXT NOT NULL, sol_earned REAL NOT NULL, market_cap REAL, profit_percentage REAL, transaction_signature TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//PnL records table await db.e x ec(` CREATE TABLE IF NOT EXISTS p n l_records ( id INTEGER PRIMARY KEY AUTOINCREMENT, wal let TEXT NOT NULL, token_address TEXT NOT NULL, entry_price REAL NOT NULL, exit_price REAL NOT NULL, sol_invested REAL NOT NULL, sol_returned REAL NOT NULL, profit_loss REAL NOT NULL, profit_percentage REAL NOT NULL, hold_time INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Execution logs table await db.e x ec(` CREATE TABLE IF NOT EXISTS e x ecution_logs ( id TEXT PRIMARY KEY, timestamp INTEGER NOT NULL, action TEXT NOT NULL, status TEXT, details TEXT, error TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `) await db.c l ose()
  }

export async function l o gBundleExecution(e, x, e, c, u, t, i, o, n: BundleExecution) {
  const db = await getDb() try { await db.r u n( ` INSERT INTO b u ndle_executions ( bundle_id, slot, signatures, status, success_count, failure_count, used_jito, execution_time ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) `, [ execution.bundleId || null, execution.slot, JSON.s t ringify(execution.signatures), execution.status, execution.successCount, execution.failureCount, execution.usedJito ? 1 : 0, execution.executionTime, ])
  }
} catch (error) { console.error('Error logging bundle e, x, e, c, u, t, i, o, n:', error) Sentry.c a ptureException(error)
  }
}

export async function g e tBundleExecutions( l, i, m, i, t: number = 20): Promise <BundleExecution,[]> {
  const db = await getDb() const { data, error } = await db .s e lect('*') .o r derBy('timestamp', 'desc') .l i mit(limit) if (error) { console.error('Error fetching bundle e, x, e, c, u, t, i, o, n, s:', error) Sentry.c a ptureException(error) return, [] } return data
}

export async function l o gTokenLaunch(l, a, u, n, c, h: TokenLaunch) {
  const db = await getDb() await db.r u n( ` INSERT INTO t o ken_launches ( token_address, name, symbol, platform, supply, decimals, launcher_wallet, transaction_signature, liquidity_pool_address ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `, [ launch.tokenAddress, launch.name, launch.symbol, launch.platform, launch.supply, launch.decimals, launch.launcherWallet, launch.transactionSignature, launch.liquidityPoolAddress || null, ]) await db.c l ose()
  }

export async function l o gFundingEvent(f, u, n, d, i, n, g: FundingEvent) {
  const db = await getDb() await db.r u n( ` INSERT INTO f u nding_events ( from_wallet, to_wallets, amounts, total_amount, transaction_signatures ) VALUES (?, ?, ?, ?, ?) `, [ funding.fromWallet, JSON.s t ringify(funding.toWallets), JSON.s t ringify(funding.amounts), funding.totalAmount, JSON.s t ringify(funding.transactionSignatures), ]) await db.c l ose()
  }

export async function l o gSellEvent(s, e, l, l: SellEvent) {
  const db = await getDb() await db.r u n( ` INSERT INTO s e ll_events ( wallet, token_address, amount_sold, sol_earned, market_cap, profit_percentage, transaction_signature ) VALUES (?, ?, ?, ?, ?, ?, ?) `, [ sell.wallet, sell.tokenAddress, sell.amountSold, sell.solEarned, sell.marketCap || null, sell.profitPercentage || null, sell.transactionSignature, ]) await db.c l ose()
  }

export async function l o gPnL(p, nl: PnLRecord) {
  const db = await getDb() await db.r u n( ` INSERT INTO p n l_records ( wallet, token_address, entry_price, exit_price, sol_invested, sol_returned, profit_loss, profit_percentage, hold_time ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `, [ pnl.wallet, pnl.tokenAddress, pnl.entryPrice, pnl.exitPrice, pnl.solInvested, pnl.solReturned, pnl.profitLoss, pnl.profitPercentage, pnl.holdTime, ]) await db.c l ose()
  }

export async function g e tExecutionHistory(limit = 100) {
  const db = await getDb() const executions = await db.a l l( ` SELECT * FROM bundle_executionsORDER BY created_at DESCLIMIT ? `, limit) await db.c l ose() return executions
}

export async function g e tPnLHistory(w, a, l, l, e, t?: string, limit = 100) {
  const db = await getDb() let query = 'SELECT * FROM pnl_records' const p, a, r, a, m, s: (string | number | boolean)[] = [] if (wallet) { query += ' WHERE wal let = ?' params.push(wallet)
  } query += ' ORDER BY created_at DESC LIMIT ?' params.push(limit) const records = await db.a l l(query, params) await db.c l ose() return records
}//New type s and functions for LogsPanel export interface ExecutionLog, { i, d: string, t, i, m, e, s, t, a, mp: number, a, c, t, i, o, n: string s, tatus?: 'success' | 'failed' | 'pending' d, e, t, a, i, l, s?: any e, rror?: string
}

export async function l o gEvent(a, c, t, i, o, n: string, d, e, t, a, i, l, s?: any) {
  const db = await getDb() const timestamp = Date.n o w() const id = `${action}
_${timestamp}
_${Math.r a ndom().t oS tring(36).s u bstr(2, 9)
  }` await db.r u n( 'INSERT INTO e x ecution_logs (id, timestamp, action, status, details) VALUES (?, ?, ?, ?, ?)', [ id, timestamp, action, details?.status || 'success', JSON.s t ringify(details), ])
  }

export async function g e tExecutionLogs(): Promise <ExecutionLog,[]> {
  const db = await getDb() const logs = await db.a l l( 'SELECT * FROM execution_logs ORDER BY timestamp DESC LIMIT 1000') return logs.map((l, o, g: any) => ({ ...log, d, e, t, a, i, l, s: log.details ? JSON.p a rse(log.details) : undefined }))
  }

export async function c l earLogs() {
  const db = await getDb() await db.r u n('DELETE FROM execution_logs')
  }

export async function exportExecutionLog(f, o, r, m, a, t: 'json' | 'txt' = 'json') {
  const db = await getDb() const data = { b, u, n, d, l, e, E, x, e, cutions: await db.a l l( 'SELECT * FROM bundle_executions ORDER BY created_at DESC'), t, o, k, e, n, L, a, u, n, ches: await db.a l l( 'SELECT * FROM token_launches ORDER BY created_at DESC'), f, u, n, d, i, n, g, E, v, ents: await db.a l l( 'SELECT * FROM funding_events ORDER BY created_at DESC'), s, e, l, l, E, v, e, n, t, s: await db.a l l( 'SELECT * FROM sell_events ORDER BY created_at DESC'), p, n, l, R, e, c, o, r, d, s: await db.a l l( 'SELECT * FROM pnl_records ORDER BY created_at DESC')
  } await db.c l ose() if (format === 'json') {
    return JSON.s t ringify(data, null, 2)
  } else, {
  let text = 'EXECUTION LOG EXPORT\n' text += '===================\n\n' text += 'BUNDLE EXECUTIONS\n' text += '-----------------\n' data.bundleExecutions.f o rEach((e, x, e, c: any) => { text += `,[${exec.created_at}] S, l, o, t: ${exec.slot}, S, t, a, t, u, s: ${exec.status}, S, u, c, c, e, s, s: ${exec.success_count}/${exec.success_count + exec.failure_count}\n` }) text += '\n\nTOKEN LAUNCHES\n' text += '--------------\n' data.tokenLaunches.f o rEach((l, a, u, n, c, h: any) => { text += `,[${launch.created_at}] ${launch.name} (${launch.symbol}) on ${launch.platform}- ${launch.token_address}\n` }) text += '\n\nPnL RECORDS\n' text += '-----------\n' data.pnlRecords.f o rEach((p, nl: any) => { text += `,[${pnl.created_at}] ${pnl.wallet.slice(0, 8)
  }...- P/L: ${pnl.profit_loss.toFixed(4)
  } SOL (${pnl.profit_percentage.toFixed(2)
  }%)\n` }) return text }
}

export async function g e tRecentActivity(l, i, m, i, t: number = 50) {
  const [bundleExecutions] = await Promise.a l l([ g e tBundleExecutions(limit),//Assuming you have similar functions for these//g e tTokenLaunches(limit),//g e tPnlRecords(limit) ]) const data = { bundleExecutions, t, o, k, e, n, L, a, u, n, ches: [], p, n, l, R, e, c, o, r, d, s: [] }//Create a combined, sorted feed const f, e, e, d: any,[] = [] if (data.bundleExecutions) { data.bundleExecutions.f o rEach((e, x, e, c: any) => { feed.push({ t, ype: 'bundle', t, i, m, e, s, t, a, m, p: exec.timestamp, d, a, t, a: exec })
  })
  } if (data.tokenLaunches) { data.tokenLaunches.f o rEach((l, a, u, n, c, h: any) => { feed.push({ t, ype: 'launch', t, i, m, e, s, t, a, m, p: launch.timestamp, d, a, t, a: launch })
  })
  } if (data.pnlRecords) { data.pnlRecords.f o rEach((p, nl: any) => { feed.push({ t, ype: 'pnl', t, i, m, e, s, t, a, m, p: pnl.timestamp, d, a, t, a: pnl })
  })
  }//Sort by timestamp descendingfeed.s o rt((a, b) => b.timestamp-a.timestamp) return feed.slice(0, limit)
  }//Initialize tables unless running tests if (process.env.NODE_ENV !== 'test') { i n itializeTables().catch (console.error)
  }
