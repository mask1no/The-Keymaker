import 'server-only';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

let dbInstance: ReturnType<typeof Database> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  slot INTEGER,
  sig TEXT,
  wallet TEXT,
  mint TEXT NOT NULL,
  side TEXT NOT NULL CHECK(side IN ('buy', 'sell')),
  qty INTEGER NOT NULL,
  priceLamports INTEGER NOT NULL,
  feeLamports INTEGER NOT NULL DEFAULT 0,
  priorityFeeLamports INTEGER DEFAULT 0,
  note TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_trades_ts ON trades(ts DESC);
CREATE INDEX IF NOT EXISTS idx_trades_mint ON trades(mint);
CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet);
CREATE INDEX IF NOT EXISTS idx_trades_sig ON trades(sig);

CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  mint TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  cost_basis_lamports INTEGER NOT NULL DEFAULT 0,
  realized_pnl_lamports INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(wallet, mint)
);

CREATE INDEX IF NOT EXISTS idx_positions_wallet ON positions(wallet);
CREATE INDEX IF NOT EXISTS idx_positions_mint ON positions(mint);

CREATE TABLE IF NOT EXISTS volume_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mint TEXT NOT NULL,
  wallet_pubkeys TEXT NOT NULL,
  buy_sell_bias REAL DEFAULT 2.0,
  min_buy_sol REAL DEFAULT 0.01,
  max_buy_sol REAL DEFAULT 0.1,
  min_sell_pct REAL DEFAULT 10,
  max_sell_pct REAL DEFAULT 50,
  delay_sec_min INTEGER DEFAULT 30,
  delay_sec_max INTEGER DEFAULT 120,
  max_actions INTEGER DEFAULT 100,
  max_spend_sol REAL DEFAULT 5.0,
  time_stop_min INTEGER DEFAULT 60,
  max_drawdown_pct REAL DEFAULT 20,
  slippage_bps INTEGER DEFAULT 300,
  impact_cap_pct REAL DEFAULT 5.0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS volume_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  status TEXT DEFAULT 'running' CHECK(status IN ('running', 'stopped', 'completed')),
  started_at INTEGER NOT NULL,
  stopped_at INTEGER,
  actions_executed INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  stats_json TEXT,
  FOREIGN KEY (profile_id) REFERENCES volume_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_volume_runs_status ON volume_runs(status);
CREATE INDEX IF NOT EXISTS idx_volume_runs_profile ON volume_runs(profile_id);

CREATE TABLE IF NOT EXISTS mint_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  ts INTEGER NOT NULL,
  side TEXT CHECK(side IN ('buy', 'sell')),
  price REAL,
  amount REAL,
  sig TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_mint_ts ON mint_activity(mint, ts DESC);

CREATE TABLE IF NOT EXISTS tx_dedupe (
  msg_hash TEXT PRIMARY KEY,
  sig TEXT NOT NULL,
  processed_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_tx_dedupe_sig ON tx_dedupe(sig);

CREATE TABLE IF NOT EXISTS ui_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS wallet_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  wallet_pubkeys TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS dev_mints (
  mint TEXT PRIMARY KEY,
  dev_wallet TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_dev_mints_wallet ON dev_mints(dev_wallet);
`;

export function getDb(): ReturnType<typeof Database> & {
  run: (sql: string, ...params: any[]) => any;
  all: (sql: string, ...params: any[]) => any[];
  get: (sql: string, ...params: any[]) => any;
} {
  if (dbInstance) {
    // Add wrapper methods if not already added
    if (!(dbInstance as any).run) {
      (dbInstance as any).run = (sql: string, ...params: any[]) => {
        const stmt = dbInstance!.prepare(sql);
        return stmt.run(...params);
      };
      (dbInstance as any).all = (sql: string, ...params: any[]) => {
        const stmt = dbInstance!.prepare(sql);
        return stmt.all(...params);
      };
      (dbInstance as any).get = (sql: string, ...params: any[]) => {
        const stmt = dbInstance!.prepare(sql);
        return stmt.get(...params);
      };
    }
    return dbInstance as any;
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'keymaker.db');

    dbInstance = new Database(dbPath);

    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('foreign_keys = ON');

    dbInstance.exec(SCHEMA_SQL);

    // Add wrapper methods
    (dbInstance as any).run = (sql: string, ...params: any[]) => {
      const stmt = dbInstance!.prepare(sql);
      return stmt.run(...params);
    };
    (dbInstance as any).all = (sql: string, ...params: any[]) => {
      const stmt = dbInstance!.prepare(sql);
      return stmt.all(...params);
    };
    (dbInstance as any).get = (sql: string, ...params: any[]) => {
      const stmt = dbInstance!.prepare(sql);
      return stmt.get(...params);
    };

    return dbInstance as any;
  } catch (err) {
    console.error('[sqlite] Initialization error:', err);
    throw new Error('Failed to initialize database');
  }
}

export interface TradeRow {
  ts: number;
  slot?: number;
  sig?: string;
  wallet?: string;
  mint: string;
  side: 'buy' | 'sell';
  qty: number;
  priceLamports: number;
  feeLamports?: number;
  priorityFeeLamports?: number;
  note?: string;
}

export function recordTrade(row: TradeRow): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO trades (ts, slot, sig, wallet, mint, side, qty, priceLamports, feeLamports, priorityFeeLamports, note)
    VALUES (@ts, @slot, @sig, @wallet, @mint, @side, @qty, @priceLamports, @feeLamports, @priorityFeeLamports, @note)
  `);

  const result = stmt.run({
    ts: row.ts,
    slot: row.slot ?? null,
    sig: row.sig ?? null,
    wallet: row.wallet ?? null,
    mint: row.mint,
    side: row.side,
    qty: row.qty,
    priceLamports: row.priceLamports,
    feeLamports: row.feeLamports ?? 0,
    priorityFeeLamports: row.priorityFeeLamports ?? 0,
    note: row.note ?? null,
  });

  return result.lastInsertRowid as number;
}

export interface ListTradesParams {
  limit?: number;
  offset?: number;
  mint?: string;
  wallet?: string;
}

export function listTrades(params: ListTradesParams = {}): any[] {
  const db = getDb();
  const limit = Math.min(params.limit ?? 500, 5000);
  const offset = params.offset ?? 0;

  let query = 'SELECT * FROM trades WHERE 1=1';
  const bindings: any = {};

  if (params.mint) {
    query += ' AND mint = @mint';
    bindings.mint = params.mint;
  }

  if (params.wallet) {
    query += ' AND wallet = @wallet';
    bindings.wallet = params.wallet;
  }

  query += ' ORDER BY ts DESC LIMIT @limit OFFSET @offset';
  bindings.limit = limit;
  bindings.offset = offset;

  const stmt = db.prepare(query);
  return stmt.all(bindings);
}

export function checkTxDedupe(msgHash: string): string | null {
  const db = getDb();
  const stmt = db.prepare('SELECT sig FROM tx_dedupe WHERE msg_hash = ?');
  const row = stmt.get(msgHash) as { sig: string } | undefined;
  return row?.sig ?? null;
}

export function recordTxDedupe(msgHash: string, sig: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT OR IGNORE INTO tx_dedupe (msg_hash, sig) VALUES (?, ?)');
  stmt.run(msgHash, sig);
}
