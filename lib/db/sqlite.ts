import 'server-only';
import Database from 'better-sqlite3';
import { join } from 'path';

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

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  const file = join(process.cwd(), 'data', 'keymaker.db');
  db = new Database(file);
  db.pragma('journal_mode = WAL');
  init(db);
  return db!;
}

function init(d: Database.Database): void {
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
  `);
}

export function recordTrade(row: TradeRow): void {
  try {
    const d = getDb();
    const stmt = d.prepare(`
      INSERT INTO trades (ts, side, mint, qty, priceLamports, feeLamports, priorityFeeLamports, slot, signature, bundleId, wallet, groupId, mode)
      VALUES (@ts, @side, @mint, @qty, @priceLamports, @feeLamports, @priorityFeeLamports, @slot, @signature, @bundleId, @wallet, @groupId, @mode)
    `);
    stmt.run({
      ts: row.ts,
      side: row.side,
      mint: row.mint,
      qty: Math.floor(row.qty || 0),
      priceLamports: Math.floor(row.priceLamports || 0),
      feeLamports: Math.floor(row.feeLamports || 0),
      slot: row.slot ?? null,
      signature: row.signature ?? null,
      bundleId: row.bundleId ?? null,
      wallet: row.wallet ?? null,
      groupId: row.groupId ?? null,
      mode: row.mode ?? null,
      priorityFeeLamports: Math.floor(row.priorityFeeLamports || 0),
    });
  } catch {
    // swallow
  }
}

export function listTrades(params: { limit?: number; offset?: number } = {}): TradeRow[] {
  const d = getDb();
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
