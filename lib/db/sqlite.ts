import 'server-only';
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/logger';

let dbInstance: any = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,
  keypair TEXT NOT NULL,
  role TEXT DEFAULT 'normal',
  network TEXT DEFAULT 'mainnet',
  balance INTEGER DEFAULT 0,
  name TEXT,
  group_name TEXT DEFAULT 'default',
  color TEXT DEFAULT '#FFFFFF',
  isActive INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_role ON wallets(role);

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

CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL UNIQUE,
  entry_price REAL,
  current_price REAL,
  quantity REAL DEFAULT 0,
  realized_pnl REAL DEFAULT 0,
  unrealized_pnl REAL DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS volume_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  period TEXT NOT NULL,
  volume REAL NOT NULL DEFAULT 0,
  txn_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_volume_mint_period ON volume_profiles(mint, period);

CREATE TABLE IF NOT EXISTS volume_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint TEXT NOT NULL,
  start_ts INTEGER NOT NULL,
  end_ts INTEGER,
  peak_volume REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

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
  sig TEXT PRIMARY KEY,
  processed_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS ui_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS dev_mints (
  mint TEXT PRIMARY KEY,
  dev_wallet TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_dev_mints_wallet ON dev_mints(dev_wallet);

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
`;

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;

  try {
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'keymaker.db');

    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await dbInstance.exec('PRAGMA journal_mode = WAL;');
    await dbInstance.exec('PRAGMA synchronous = NORMAL;');
    await dbInstance.exec('PRAGMA foreign_keys = ON;');

    await dbInstance.exec(SCHEMA_SQL);

    return dbInstance;
  } catch (err) {
    logger.error('DB initialization error:', { error: err });
    const noop = async () => undefined;
    const noopAll = async () => [] as any[];
    const noopRun = async () => ({ lastID: 0, changes: 0 });
    dbInstance = {
      exec: noop,
      run: noopRun,
      all: noopAll,
      get: noop,
      close: noop,
    };
    return dbInstance;
  }
}

interface RecordTradeParams {
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

export async function recordTrade(params: RecordTradeParams): Promise<number> {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO trades (ts, slot, sig, wallet, mint, side, qty, priceLamports, feeLamports, priorityFeeLamports, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.ts,
      params.slot ?? null,
      params.sig ?? null,
      params.wallet ?? null,
      params.mint,
      params.side,
      params.qty,
      params.priceLamports,
      params.feeLamports ?? 0,
      params.priorityFeeLamports ?? 0,
      params.note ?? null,
    ]
  );
  return result.lastID;
}

interface ListTradesParams {
  limit?: number;
  offset?: number;
}

export async function listTrades(params: ListTradesParams = {}): Promise<any[]> {
  const db = await getDb();
  const limit = Math.min(params.limit ?? 500, 500);
  const offset = params.offset ?? 0;

  const trades = await db.all(
    `SELECT * FROM trades ORDER BY ts DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return trades;
}

const promisedDb = getDb();
export { promisedDb as db };

