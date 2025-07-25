import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

async function initializeDatabase() {
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Open database connection
  const db = await open({
    filename: path.join(dataDir, 'analytics.db'),
    driver: sqlite3.Database
  });

  console.log('Initializing database...');

  // Create wallets table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publicKey TEXT UNIQUE NOT NULL,
      encryptedPrivateKey TEXT NOT NULL,
      role TEXT NOT NULL,
      balance REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tokens table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      platform TEXT NOT NULL,
      supply TEXT NOT NULL,
      decimals INTEGER NOT NULL,
      metadata JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create bundles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      executedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      fees REAL,
      outcomes JSON
    )
  `);

  // Create bundle executions table
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
  `);

  // Create token launches table
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
  `);

  // Create funding events table
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
  `);

  // Create sell events table
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
  `);

  // Create PnL records table
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
  `);

  // Create indices for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wallets_role ON wallets(role);
    CREATE INDEX IF NOT EXISTS idx_bundle_executions_created ON bundle_executions(created_at);
    CREATE INDEX IF NOT EXISTS idx_pnl_records_wallet ON pnl_records(wallet);
    CREATE INDEX IF NOT EXISTS idx_pnl_records_created ON pnl_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_token_launches_platform ON token_launches(platform);
  `);

  console.log('Database initialized successfully!');
  
  await db.close();
}

// Run initialization
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}); 