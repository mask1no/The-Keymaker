import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  folder_id: text("folder_id").notNull(),
  pubkey: text("pubkey").notNull().unique(),
  enc_privkey: text("enc_privkey").notNull(),
  role: text("role").default("sniper"),
  created_at: integer("created_at")
});

export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  max_wallets: integer("max_wallets").default(20)
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  ca: text("ca").notNull(),
  folder_id: text("folder_id").notNull(),
  wallet_count: integer("wallet_count").notNull(),
  params: text("params").notNull(),
  state: text("state").notNull(),
  created_at: integer("created_at"),
  updated_at: integer("updated_at")
});

export const task_events = sqliteTable("task_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task_id: text("task_id").notNull(),
  state: text("state").notNull(),
  info: text("info"),
  at: integer("at")
});

export const fills = sqliteTable("fills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task_id: text("task_id"),
  wallet_pubkey: text("wallet_pubkey"),
  ca: text("ca"),
  side: text("side"),
  qty: real("qty"),
  price: real("price"),
  sig: text("sig"),
  slot: integer("slot"),
  fee_lamports: integer("fee_lamports"),
  tip_lamports: integer("tip_lamports"),
  at: integer("at")
});

export const tx_dedupe = sqliteTable("tx_dedupe", {
  hash: text("hash").primaryKey(),
  result: text("result"), // JSON: { sigs: string[], bundleId?: string }
  created_at: integer("created_at")
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value")
});

const dbFile = process.env.DB_FILE ?? "./apps/daemon/keymaker.sqlite";
const raw = new Database(dbFile);
export const db = drizzle(raw);

export function ensureDb() {
  raw.exec(`
    CREATE TABLE IF NOT EXISTS wallets (id TEXT PRIMARY KEY, folder_id TEXT, pubkey TEXT UNIQUE, enc_privkey TEXT, role TEXT, created_at INTEGER);
    CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, name TEXT, max_wallets INTEGER DEFAULT 20);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, kind TEXT, ca TEXT, folder_id TEXT, wallet_count INTEGER, params TEXT, state TEXT, created_at INTEGER, updated_at INTEGER);
    CREATE TABLE IF NOT EXISTS task_events (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, state TEXT, info TEXT, at INTEGER);
    CREATE TABLE IF NOT EXISTS fills (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, wallet_pubkey TEXT, ca TEXT, side TEXT, qty REAL, price REAL, sig TEXT, slot INTEGER, fee_lamports INTEGER, tip_lamports INTEGER, at INTEGER);
    CREATE TABLE IF NOT EXISTS tx_dedupe (hash TEXT PRIMARY KEY, result TEXT, created_at INTEGER);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  `);
  // Seed sensible defaults if missing
  const defaults: Array<[string, string]> = [
    ["MAX_TX_SOL", "1"],
    ["MAX_SOL_PER_MIN", "10"],
    ["MAX_SESSION_SOL", "50"]
  ];
  for (const [k, v] of defaults) {
    const r = raw.prepare("SELECT value FROM settings WHERE key = ?").get(k) as any;
    if (!r) raw.prepare("INSERT INTO settings(key,value) VALUES(?,?)").run(k, v);
  }
}

export function getSetting(key: string): string | undefined {
  try {
    const r = raw.prepare("SELECT value FROM settings WHERE key = ?").get(key) as any;
    return r?.value as string | undefined;
  } catch { return undefined; }
}

export function setSetting(key: string, value: string) {
  raw.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, value);
}


