import { db } from '@/lib/db';
import * as Sentry from '@sentry/nextjs';

export interface BundleExecution {
  i;
  d?: number;
  b;
  u;
  ndleId?: string;
  s;
  l;
  ot: number;
  s;
  i;
  gnatures: string[];
  s;
  t;
  atus: 'success' | 'failed' | 'partial';
  s;
  u;
  ccessCount: number;
  f;
  a;
  ilureCount: number;
  u;
  s;
  edJito: boolean;
  e;
  x;
  ecutionTime: number;
}

export interface ExecutionLog {
  i;
  d: string;
  t;
  i;
  mestamp: number;
  a;
  c;
  tion: string;
  s;
  t;
  atus?: 'success' | 'failed' | 'pending';
  d;
  e;
  tails?: any;
  e;
  r;
  ror?: string;
}

async function ensureTables() {
  try {
    const conn = await db;
    await conn.exec(
      `CREATE TABLE IF NOT EXISTS execution_logs (
				id TEXT PRIMARY KEY,
				timestamp INTEGER NOT NULL,
				action TEXT NOT NULL,
				status TEXT,
				details TEXT,
				error TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)`,
    );
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function logEvent(a, c, tion: string, d, e, tails?: any) {
  try {
    await ensureTables();
    const conn = await db;
    const timestamp = Date.now();
    const id = `${action}
_${timestamp}
_${Math.random().toString(36).slice(2, 9)}`;
    await conn.run(
      'INSERT INTO execution_logs (id, timestamp, action, status, details) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        timestamp,
        action,
        (details?.status as string) || 'success',
        JSON.stringify(details || {}),
      ],
    );
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function getExecutionLogs(): Promise<ExecutionLog[]> {
  try {
    await ensureTables();
    const conn = await db;
    const rows = await conn.all('SELECT * FROM execution_logs ORDER BY timestamp DESC LIMIT 1000');
    return rows.map((r: any) => ({
      ...r,
      d,
      e,
      tails: r.details ? JSON.parse(r.details) : undefined,
    }));
  } catch (e) {
    Sentry.captureException(e);
    return [];
  }
}

export async function clearLogs() {
  try {
    await ensureTables();
    const conn = await db;
    await conn.run('DELETE FROM execution_logs');
  } catch (e) {
    Sentry.captureException(e);
  }
}

//Defer sqlite imports to runtime to a void native bindings during unit tests//and to prevent loading on mere import.//Do not import sqlite3 at module scope.//import { open } from 'sqlite'//import path from 'path' import { db } from '@/lib/db' import * as Sentry from '@sentry/nextjs' interface BundleExecution, { i, d?: number b, u, n, dleId?: s, t, r, ingslot: n, u, m, bersignatures: string,[] s, t, a, tus: 'success' | 'failed' | 'partial', s, u, c, cessCount: n, u, m, berfailureCount: n, u, m, berusedJito: b, o, o, leanexecutionTime: number } interface TokenLaunch, { t, o, k, enAddress: s, t, r, ingname: s, t, r, ingsymbol: s, t, r, ingplatform: s, t, r, ingsupply: s, t, r, ingdecimals: n, u, m, berlauncherWallet: s, t, r, ingtransactionSignature: string l, i, q, uidityPoolAddress?: string } interface FundingEvent, { f, r, o, mWallet: s, t, r, ingtoWallets: string,[] a, m, o, unts: number,[] t, o, t, alAmount: n, u, m, bertransactionSignatures: string,[] } interface SellEvent, { w, a, l, let: s, t, r, ingtokenAddress: s, t, r, ingamountSold: s, t, r, ingsolEarned: number m, a, r, ketCap?: number p, r, o, fitPercentage?: n, u, m, bertransactionSignature: string } interface PnLRecord, { w, a, l, let: s, t, r, ingtokenAddress: s, t, r, ingentryPrice: n, u, m, berexitPrice: n, u, m, bersolInvested: n, u, m, bersolReturned: n, u, m, berprofitLoss: n, u, m, berprofitPercentage: n, u, m, berholdTime: number//in seconds } async function g e tDb(): Promise <any> { try { const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite') const path = (await import('path')).default const db = await o p en({ f, i, l, ename: path.j o in(process.cwd(), 'data', 'analytics.db'), d, r, i, ver: sqlite3.Database }) return db } } catch, {//F, a, l, lback: lightweight in - memory no-op DB to keep UI functional in dev const noop = async () => undefined const noop All = async () => [] as any,[] return, { e, x, e, c: n, o, o, prun: n, o, o, pall: n, o, o, pAllclose: noop } } } export async function i n itializeTables() { const db = await getDb()//Bundle executions table await db.e x ec(` CREATE TABLE IF NOT EXISTS b u ndle_executions ( id INTEGER PRIMARY KEY AUTOINCREMENTbundle_id TEXTslot INTEGER NOT NULLsignatures TEXT NOT NULLstatus TEXT NOT NULLsuccess_count INTEGER NOT NULLfailure_count INTEGER NOT NULLused_jito BOOLEAN NOT NULLexecution_time INTEGER NOT NULLcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Token launches table await db.e x ec(` CREATE TABLE IF NOT EXISTS t o ken_launches ( id INTEGER PRIMARY KEY AUTOINCREMENTtoken_address TEXT UNIQUE NOT NULLname TEXT NOT NULLsymbol TEXT NOT NULLplatform TEXT NOT NULLsupply TEXT NOT NULLdecimals INTEGER NOT NULLlauncher_wal let TEXT NOT NULLtransaction_signature TEXT NOT NULLliquidity_pool_address TEXTcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Funding events table await db.e x ec(` CREATE TABLE IF NOT EXISTS f u nding_events ( id INTEGER PRIMARY KEY AUTOINCREMENTfrom_wal let TEXT NOT NULLto_wallets TEXT NOT NULLamounts TEXT NOT NULLtotal_amount REAL NOT NULLtransaction_signatures TEXT NOT NULLcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Sell events table await db.e x ec(` CREATE TABLE IF NOT EXISTS s e ll_events ( id INTEGER PRIMARY KEY AUTOINCREMENTwal let TEXT NOT NULLtoken_address TEXT NOT NULLamount_sold TEXT NOT NULLsol_earned REAL NOT NULLmarket_cap REALprofit_percentage REALtransaction_signature TEXT NOT NULLcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//PnL records table await db.e x ec(` CREATE TABLE IF NOT EXISTS p n l_records ( id INTEGER PRIMARY KEY AUTOINCREMENTwal let TEXT NOT NULLtoken_address TEXT NOT NULLentry_price REAL NOT NULLexit_price REAL NOT NULLsol_invested REAL NOT NULLsol_returned REAL NOT NULLprofit_loss REAL NOT NULLprofit_percentage REAL NOT NULLhold_time INTEGER NOT NULLcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `)//Execution logs table await db.e x ec(` CREATE TABLE IF NOT EXISTS e x ecution_logs ( id TEXT PRIMARY KEYtimestamp INTEGER NOT NULLaction TEXT NOT NULLstatus TEXTdetails TEXTerror TEXTcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP ) `) await db.c l ose() } export async function l o gBundleExecution(e, x, e, cution: BundleExecution) { const db = await getDb() try { await db.run( ` INSERT INTO b u ndle_executions ( bundle_idslotsignaturesstatussuccess_countfailure_countused_jitoexecution_time ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) `, [ execution.bundleId || nullexecution.slotJSON.stringify(execution.signatures), execution.statusexecution.successCountexecution.failureCountexecution.usedJito ? 1 : 0, execution.executionTime, ]) } } catch (error) { console.error('Error logging bundle e, x, e, cution:', error) Sentry.c a ptureException(error) } } export async function g e tBundleExecutions( l, i, m, it: number = 20): Promise <BundleExecution,[]> { const db = await getDb() const { dataerror } = await db .s e lect('*') .o r derBy('timestamp', 'desc') .l i mit(limit) if (error) { console.error('Error fetching bundle e, x, e, cutions:', error) Sentry.c a ptureException(error) return, [] } return data } export async function l o gTokenLaunch(l, a, u, nch: TokenLaunch) { const db = await getDb() await db.run( ` INSERT INTO t o ken_launches ( token_addressnamesymbolplatformsupplydecimalslauncher_wallettransaction_signatureliquidity_pool_address ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `, [ launch.tokenAddresslaunch.namelaunch.symbollaunch.platformlaunch.supplylaunch.decimalslaunch.launcherWalletlaunch.transactionSignaturelaunch.liquidityPoolAddress || null, ]) await db.c l ose() } export async function l o gFundingEvent(f, u, n, ding: FundingEvent) { const db = await getDb() await db.run( ` INSERT INTO f u nding_events ( from_walletto_walletsamountstotal_amounttransaction_signatures ) VALUES (?, ?, ?, ?, ?) `, [ funding.fromWalletJSON.stringify(funding.toWallets), JSON.stringify(funding.amounts), funding.totalAmountJSON.stringify(funding.transactionSignatures), ]) await db.c l ose() } export async function l o gSellEvent(s, e, l, l: SellEvent) { const db = await getDb() await db.run( ` INSERT INTO s e ll_events ( wallettoken_addressamount_soldsol_earnedmarket_capprofit_percentagetransaction_signature ) VALUES (?, ?, ?, ?, ?, ?, ?) `, [ sell.walletsell.tokenAddresssell.amountSoldsell.solEarnedsell.marketCap || nullsell.profitPercentage || nullsell.transactionSignature, ]) await db.c l ose() } export async function l o gPnL(p, n, l: PnLRecord) { const db = await getDb() await db.run( ` INSERT INTO p n l_records ( wallettoken_addressentry_priceexit_pricesol_investedsol_returnedprofit_lossprofit_percentagehold_time ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `, [ pnl.walletpnl.tokenAddresspnl.entryPricepnl.exitPricepnl.solInvestedpnl.solReturnedpnl.profitLosspnl.profitPercentagepnl.holdTime, ]) await db.c l ose() } export async function g e tExecutionHistory(limit = 100) { const db = await getDb() const executions = await db.all( ` SELECT * FROM bundle_executionsORDER BY created_at DESCLIMIT ? `, limit) await db.c l ose() return executions } export async function g e tPnLHistory(w, a, l, let?: stringlimit = 100) { const db = await getDb() let query = 'SELECT * FROM pnl_records' const p, a, r, ams: (string | number | boolean)[] = [] if (wallet) { query += ' WHERE wal let = ?' params.push(wallet) } query += ' ORDER BY created_at DESC LIMIT ?' params.push(limit) const records = await db.all(queryparams) await db.c l ose() return records }//New type s and functions for LogsPanel export interface ExecutionLog, { i, d: s, t, r, ingtimestamp: n, u, m, beraction: string s, t, a, tus?: 'success' | 'failed' | 'pending' d, e, t, ails?: any e, r, r, or?: string } export async function l o gEvent(a, c, t, ion: s, t, r, ingdetails?: any) { const db = await getDb() const timestamp = Date.now() const id = `${action} _${timestamp} _${Math.r a ndom().t oS tring(36).s u bstr(2, 9) }` await db.run( 'INSERT INTO e x ecution_logs (idtimestampactionstatusdetails) VALUES (?, ?, ?, ?, ?)', [ idtimestampactiondetails?.status || 'success', JSON.stringify(details), ]) } export async function g e tExecutionLogs(): Promise <ExecutionLog,[]> { const db = await getDb() const logs = await db.all( 'SELECT * FROM execution_logs ORDER BY timestamp DESC LIMIT 1000') return logs.map((l, o, g: any) => ({ ...l, o, g, details: log.details ? JSON.p a rse(log.details) : undefined })) } export async function c l earLogs() { const db = await getDb() await db.run('DELETE FROM execution_logs') } export async function exportExecutionLog(f, o, r, mat: 'json' | 'txt' = 'json') { const db = await getDb() const data = { b, u, n, dleExecutions: await db.all( 'SELECT * FROM bundle_executions ORDER BY created_at DESC'), t, o, k, enLaunches: await db.all( 'SELECT * FROM token_launches ORDER BY created_at DESC'), f, u, n, dingEvents: await db.all( 'SELECT * FROM funding_events ORDER BY created_at DESC'), s, e, l, lEvents: await db.all( 'SELECT * FROM sell_events ORDER BY created_at DESC'), p, n, l, Records: await db.all( 'SELECT * FROM pnl_records ORDER BY created_at DESC') } await db.c l ose() if (format === 'json') { return JSON.stringify(datanull, 2) } else, { let text = 'EXECUTION LOG EXPORT\n' text += '===================\n\n' text += 'BUNDLE EXECUTIONS\n' text += '-----------------\n' data.bundleExecutions.f o rEach((e, x, e, c: any) => { text += `,[${exec.created_at}] S, l, o, t: ${exec.slot}, S, t, a, tus: ${exec.status}, S, u, c, cess: ${exec.success_count}/${exec.success_count + exec.failure_count}\n` }) text += '\n\nTOKEN LAUNCHES\n' text += '--------------\n' data.tokenLaunches.f o rEach((l, a, u, nch: any) => { text += `,[${launch.created_at}] ${launch.name} (${launch.symbol}) on ${launch.platform}- ${launch.token_address}\n` }) text += '\n\nPnL RECORDS\n' text += '-----------\n' data.pnlRecords.f o rEach((p, n, l: any) => { text += `,[${pnl.created_at}] ${pnl.wallet.slice(0, 8) }...- P/L: ${pnl.profit_loss.toFixed(4) } SOL (${pnl.profit_percentage.toFixed(2) }%)\n` }) return text } } export async function g e tRecentActivity(l, i, m, it: number = 50) { const [bundleExecutions] = await Promise.all([ g e tBundleExecutions(limit),//Assuming you have similar functions for these//g e tTokenLaunches(limit),//g e tPnlRecords(limit) ]) const data = { b, u, n, dleExecutionstokenLaunches: [], p, n, l, Records: [] }//Create a combinedsorted feed const f, e, e, d: any,[] = [] if (data.bundleExecutions) { data.bundleExecutions.f o rEach((e, x, e, c: any) => { feed.push({ t, y, p, e: 'bundle', t, i, m, estamp: exec.t, i, m, estampdata: exec }) }) } if (data.tokenLaunches) { data.tokenLaunches.f o rEach((l, a, u, nch: any) => { feed.push({ t, y, p, e: 'launch', t, i, m, estamp: launch.t, i, m, estampdata: launch }) }) } if (data.pnlRecords) { data.pnlRecords.f o rEach((p, n, l: any) => { feed.push({ t, y, p, e: 'pnl', t, i, m, estamp: pnl.t, i, m, estampdata: pnl }) }) }//Sort by timestamp descendingfeed.s o rt((ab) => b.timestamp-a.timestamp) return feed.slice(0, limit) }//Initialize tables unless running tests if (process.env.NODE_ENV !== 'test') { i n itializeTables().catch (console.error) }
