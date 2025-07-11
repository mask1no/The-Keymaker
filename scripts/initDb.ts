import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('data/analytics.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publicKey TEXT UNIQUE NOT NULL,
    encryptedPrivateKey TEXT NOT NULL,
    role TEXT NOT NULL,
    balance REAL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    platform TEXT NOT NULL,
    supply BIGINT NOT NULL,
    metadata JSON
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bundles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    executedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL,
    fees REAL,
    outcomes JSON
  )`);
});

db.close(); 