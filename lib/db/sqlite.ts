import { join } from 'path';
import 'server-only';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BetterSqlite3 = require('better-sqlite3');

export type TradeRow = {
  id?: number;
  ts: number; // epoch ms
  side: 'buy' | 'sell';
  mint: string;
  qty: number; // base units
  priceLamports: number; // lamports per token
  feeLamports: number;
  priorityFeeLamports?: number;
  slot: number | null;
  signature: string | null;
  bundleId: string | null;
  wallet: string | null;
  groupId: string | null;
  mode: 'RPC' | 'JITO' | null;
};

let db: any | null = null;

export function getDb(): any {
  if (db) return db;
  const file = join(process.cwd(), 'data', 'keymaker.db');
  try {
    db = new BetterSqlite3(file);
    if (db) {
      db.pragma('journal_mode = WAL');
    }
    init(db);
    return db!;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return null;
  }
}

function init(d: any): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      side TEXT NOT NULL,
      mint TEXT NOT NULL,
      qty INTEGER NOT NULL,
      priceLamports INTEGER NOT NULL,
      feeLamports INTEGER NOT NULL DEFAULT 0,
      priorityFeeLamports INTEGER NOT NULL DEFAULT 0,
      slot INTEGER,
      signature TEXT,
      bundleId TEXT,
      wallet TEXT,
      groupId TEXT,
      mode TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_trades_mint ON trades(mint);
    CREATE INDEX IF NOT EXISTS idx_trades_group ON trades(groupId);
    CREATE INDEX IF NOT EXISTS idx_trades_ts ON trades(ts);
    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundleId TEXT NOT NULL,
      status TEXT NOT NULL,
      slot INTEGER,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prices_cache (
      mint TEXT PRIMARY KEY,
      lamportsPerToken INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS tx_dedupe (
      msgHash TEXT PRIMARY KEY,
      firstSeenAt INTEGER NOT NULL,
      status TEXT NOT NULL,
      signature TEXT,
      slot INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_tx_dedupe_msgHash ON tx_dedupe(msgHash);
    CREATE TABLE IF NOT EXISTS mm_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt INTEGER NOT NULL,
      groupId TEXT NOT NULL,
      wallet TEXT NOT NULL,
      mint TEXT NOT NULL,
      side TEXT NOT NULL,
      buyLamports INTEGER,
      sellTokens INTEGER,
      slippageBps INTEGER NOT NULL,
      turbo INTEGER NOT NULL DEFAULT 0,
      tipLamports INTEGER DEFAULT 0,
      priorityFeeMicrolamports INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      signature TEXT,
      slot INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_mm_queue_status ON mm_queue(status);
    CREATE INDEX IF NOT EXISTS idx_mm_queue_group ON mm_queue(groupId);
    CREATE TABLE IF NOT EXISTS mm_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queueId INTEGER NOT NULL,
      status TEXT NOT NULL,
      signature TEXT,
      slot INTEGER,
      error TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS volume_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      json TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS volume_runs (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      status TEXT NOT NULL,
      startedAt INTEGER NOT NULL,
      stoppedAt INTEGER,
      stats_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS mint_activity (
      mint TEXT PRIMARY KEY,
      last_action_ts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ui_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      keypair TEXT NOT NULL,
      user_pubkey TEXT NOT NULL,
      group_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_pubkey);
    CREATE INDEX IF NOT EXISTS idx_wallets_group ON wallets(group_id);
    CREATE TABLE IF NOT EXISTS wallet_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_pubkey TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_groups_user ON wallet_groups(user_pubkey);
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_pubkey TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_pubkey);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS coin_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      description TEXT,
      image TEXT,
      category TEXT,
      tags TEXT,
      supply INTEGER,
      decimals INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_coin_templates_user ON coin_templates(user_id);
    CREATE TABLE IF NOT EXISTS volume_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      mint TEXT NOT NULL,
      wallet_group TEXT NOT NULL,
      buy_amount REAL NOT NULL,
      sell_amount REAL NOT NULL,
      buy_sell_ratio REAL NOT NULL,
      delay_min INTEGER NOT NULL,
      delay_max INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_volume_tasks_user ON volume_tasks(user_id);
  `);
}

export function recordTrade(row: TradeRow): void {
  try {
    const d = getDb();
    if (!d) return;
    const stmt = d.prepare(`
      INSERT INTO trades (ts, side, mint, qty, priceLamports, feeLamports, priorityFeeLamports, slot, signature, bundleId, wallet, groupId, mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      row.ts,
      row.side,
      row.mint,
      Math.floor(row.qty || 0),
      Math.floor(row.priceLamports || 0),
      Math.floor(row.feeLamports || 0),
      Math.floor(row.priorityFeeLamports || 0),
      row.slot ?? null,
      row.signature ?? null,
      row.bundleId ?? null,
      row.wallet ?? null,
      row.groupId ?? null,
      row.mode ?? null,
    );
  } catch {
    // swallow
  }
}

export function listTrades(params: { limit?: number; offset?: number } = {}): TradeRow[] {
  const d = getDb();
  if (!d) return [];
  const limit = Math.max(1, Math.min(1000, params.limit ?? 200));
  const offset = Math.max(0, params.offset ?? 0);
  const stmt = d.prepare('SELECT * FROM trades ORDER BY ts DESC LIMIT ? OFFSET ?');
  return stmt.all(limit, offset) as TradeRow[];
}

export type PnLAggregates = {
  buysLamports: number;
  sellsLamports: number;
  feesLamports: number;
  realizedLamports: number;
  unrealizedLamports: number;
  netLamports: number;
};

export function aggregatePnL(currentPricesLamports: Record<string, number>): PnLAggregates {
  const d = getDb();
  if (!d) {
    return {
      buysLamports: 0,
      sellsLamports: 0,
      feesLamports: 0,
      realizedLamports: 0,
      unrealizedLamports: 0,
      netLamports: 0,
    };
  }
  const rows = d
    .prepare(
      'SELECT side, mint, qty, priceLamports, feeLamports, priorityFeeLamports FROM trades ORDER BY ts ASC',
    )
    .all() as Array<{
    side: 'buy' | 'sell';
    mint: string;
    qty: number;
    priceLamports: number;
    feeLamports: number;
    priorityFeeLamports: number;
  }>;
  const pos: Record<string, { qty: number; cost: number }> = {};
  let buys = 0,
    sells = 0,
    fees = 0,
    realized = 0;
  for (const r of rows) {
    fees += (r.feeLamports || 0) + (r.priorityFeeLamports || 0);
    if (r.side === 'buy') {
      buys += r.qty * r.priceLamports + ((r.feeLamports || 0) + (r.priorityFeeLamports || 0));
      const p = pos[r.mint] || { qty: 0, cost: 0 };
      p.cost += r.qty * r.priceLamports;
      p.qty += r.qty;
      pos[r.mint] = p;
    } else {
      sells += r.qty * r.priceLamports - ((r.feeLamports || 0) + (r.priorityFeeLamports || 0));
      const p = pos[r.mint] || { qty: 0, cost: 0 };
      const qtyOut = Math.min(p.qty, r.qty);
      const avg = p.qty > 0 ? p.cost / p.qty : 0;
      p.qty -= qtyOut;
      p.cost -= qtyOut * avg;
      pos[r.mint] = p;
      realized += qtyOut * (r.priceLamports - avg);
    }
  }
  let unrealized = 0;
  for (const [mint, p] of Object.entries(pos)) {
    if (p.qty <= 0) continue;
    const avg = p.cost / p.qty;
    const spot = currentPricesLamports[mint] ?? avg;
    unrealized += p.qty * (spot - avg);
  }
  return {
    buysLamports: buys,
    sellsLamports: sells,
    feesLamports: fees,
    realizedLamports: realized,
    unrealizedLamports: unrealized,
    netLamports: realized + unrealized,
  };
}

export function checkTxDedupe(msgHash: string): string | null {
  try {
    const d = getDb();
    if (!d) return null;
    const stmt = d.prepare('SELECT signature FROM tx_dedupe WHERE msgHash = ?');
    const result = stmt.get(msgHash);
    return result?.signature || null;
  } catch {
    return null;
  }
}

export function recordTxDedupe(msgHash: string, signature: string): void {
  try {
    const d = getDb();
    if (!d) return;
    const stmt = d.prepare(`
      INSERT OR REPLACE INTO tx_dedupe (msgHash, firstSeenAt, status, signature)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(msgHash, Date.now(), 'sent', signature);
  } catch {
    // swallow
  }
}
