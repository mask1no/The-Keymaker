import { Connection, SendOptions } from "@solana/web3.js";
import { getSetting } from "./db";
import { logger } from "@keymaker/logger";

let rpcPool: Connection[] = [];
let primaryIndex = 0;

function sanitizeUrls(urls: string[]): string[] {
  return urls
    .map((u) => (u || "").trim())
    .filter((u) => !!u)
    .filter((u, i, arr) => arr.indexOf(u) === i);
}

export function initRpcPool(): void {
  const fromSetting = (getSetting("RPC_URLS") || "").split(/[,\s]+/g);
  const fromEnv = (process.env.RPC_URLS || "").split(/[,\s]+/g);
  const single = process.env.RPC_URL || getSetting("RPC_URL") || "https://api.mainnet-beta.solana.com";
  const urls = sanitizeUrls([...fromSetting, ...fromEnv, single]);
  rpcPool = urls.map((u) => new Connection(u, { commitment: "confirmed" }));
  primaryIndex = 0;
  try {
    const masked = urls.map((u) => {
      try {
        const url = new URL(u);
        url.search = ""; // drop query (api keys)
        return url.toString();
      } catch { return u.replace(/\?.*$/, ""); }
    });
    logger.info("rpc-pool", { size: rpcPool.length, urls: masked });
  } catch {}
}

export function getRpcPool(): Connection[] {
  if (!rpcPool.length) initRpcPool();
  return rpcPool;
}

export function getPrimaryConn(): Connection {
  const pool = getRpcPool();
  return pool[primaryIndex] || pool[0];
}

export function rotatePrimary(): void {
  const pool = getRpcPool();
  if (!pool.length) return;
  primaryIndex = (primaryIndex + 1) % pool.length;
}

export async function hedgedSendRawTransaction(
  raw: Buffer,
  opts?: SendOptions & { hedgeFanout?: number; staggerMs?: number }
): Promise<string> {
  const pool = getRpcPool();
  const fanout = Math.min(pool.length, Math.max(1, opts?.hedgeFanout ?? 2));
  const stagger = Math.max(0, opts?.staggerMs ?? 60);
  let resolved = false;
  let lastErr: any;
  const sendOne = async (conn: Connection, delayMs: number) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    if (resolved) return;
    try {
      const sig = await conn.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 3 });
      if (!resolved) {
        resolved = true;
        return sig;
      }
    } catch (e) {
      lastErr = e;
    }
    return undefined;
  };
  const tasks: Array<Promise<string | undefined>> = [];
  for (let i = 0; i < fanout; i++) {
    tasks.push(sendOne(pool[i], i * stagger));
  }
  const results = await Promise.all(tasks);
  const sig = results.find((s) => typeof s === "string" && s.length > 0);
  if (sig) return sig as string;
  throw lastErr || new Error("RPC_SEND_FAIL");
}

export async function hedgedGetSignatureStatus(
  sig: string,
  timeoutMs: number = 15000
): Promise<"confirmed" | "finalized" | "timeout"> {
  const pool = getRpcPool();
  const t0 = Date.now();
  while ((Date.now() - t0) < timeoutMs) {
    const res = await Promise.allSettled(
      pool.map(async (c) => {
        const r = await c.getSignatureStatus(sig, { searchTransactionHistory: true });
        return r?.value?.confirmationStatus;
      })
    );
    const ok = res
      .map((r) => (r.status === "fulfilled" ? (r as any).value : undefined))
      .find((s) => s === "confirmed" || s === "finalized");
    if (ok) return ok as any;
    await new Promise((r) => setTimeout(r, 600));
  }
  return "timeout";
}


