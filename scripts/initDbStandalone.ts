import fs from 'fs';
import path from 'path';

// Lazy require to avoid type dependency during typecheck
let BetterSqlite3: any;
try {
  BetterSqlite3 = require('better-sqlite3');
} catch {}

export async function initializeDatabase() {
  console.log('Initializing database...');
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
  }
  
  if (!BetterSqlite3) {
    console.error('better-sqlite3 not available');
    return;
  }
  
  const file = path.join(dataDir, 'keymaker.db');
  const db = new BetterSqlite3(file);
  db.pragma('journal_mode = WAL');
  
  // Initialize tables
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      public_key TEXT NOT NULL UNIQUE,
      private_key_encrypted TEXT NOT NULL,
      group_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mint TEXT NOT NULL UNIQUE,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      decimals INTEGER NOT NULL,
      supply INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pnl_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      wallet TEXT NOT NULL,
      mint TEXT NOT NULL,
      side TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL NOT NULL,
      pnl REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id TEXT NOT NULL UNIQUE,
      transactions TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

    CREATE INDEX IF NOT EXISTS idx_trades_ts ON trades(ts);
    CREATE INDEX IF NOT EXISTS idx_trades_mint ON trades(mint);
    CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_wallets_group ON wallets(group_id);
    CREATE INDEX IF NOT EXISTS idx_errors_ts ON errors(ts);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_ts ON execution_logs(ts);
    CREATE INDEX IF NOT EXISTS idx_pnl_records_ts ON pnl_records(ts);
    CREATE INDEX IF NOT EXISTS idx_pnl_records_wallet ON pnl_records(wallet);
    CREATE INDEX IF NOT EXISTS idx_bundles_status ON bundles(status);
    CREATE INDEX IF NOT EXISTS idx_coin_templates_user ON coin_templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_volume_tasks_user ON volume_tasks(user_id);
  `);
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map((t: any) => t.name as string);
  
  console.log('Database initialized successfully');
  console.log(`Tables: ${tableNames.join(', ')}`);
  
  db.close();
}

if (require.main === module) {
  initializeDatabase().catch(console.error);
}
