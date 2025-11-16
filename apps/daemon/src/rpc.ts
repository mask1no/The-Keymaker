import { Connection, SendOptions } from "@solana/web3.js";

let pool: Connection[] = [];
let primary = 0;

function urls(): string[] {
  const x = [
    ...(process.env.RPC_URLS || "").split(/[,\s]+/g),
    process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
  ].map((u) => u.trim()).filter(Boolean);
  return [...new Set(x)];
}

export function initRpcPool() {
  pool = urls().map((u) => new Connection(u, { commitment: "confirmed" }));
  primary = 0;
}

export function getPrimaryConn(): Connection {
  if (!pool.length) initRpcPool();
  return pool[primary];
}

function rotate() { if (pool.length > 1) primary = (primary + 1) % pool.length; }

export async function hedgedSendRawTransaction(rawConn: Connection, raw: Buffer | Uint8Array, opts?: SendOptions) {
  try { return await rawConn.sendRawTransaction(raw, opts); }
  catch { rotate(); return await getPrimaryConn().sendRawTransaction(raw, opts); }
}

export function getRpcPool(): Connection[] {
  if (!pool.length) initRpcPool();
  return pool;
}
