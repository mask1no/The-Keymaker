import { VersionedTransaction } from "@solana/web3.js";
import { logger } from "@keymaker/logger";
import { getSetting } from "../db";

function getBase(): string | null {
  const fromEnv = process.env.PUMP_PORTAL_BASE?.trim();
  const fromDb = (getSetting("PUMP_PORTAL_BASE") || "").trim();
  const base = fromEnv || fromDb;
  return base ? base.replace(/\/$/, "") : null;
}

function pickTxField(j: any): string | null {
  if (!j || typeof j !== "object") return null;
  const candidates = [
    j.swapTransaction,
    j.transaction,
    j.tx,
    j.txBase64,
    j.encodedTransaction,
    j?.data?.swapTransaction,
    j?.data?.transaction,
    j?.data?.tx
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 100) return c;
  }
  return null;
}

async function postJson(url: string, body: any, headers?: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try { logger.error("pumpportal-http-fail", { status: res.status, text: text.slice(0, 300) }); } catch {}
    throw new Error("PUMPPORTAL_HTTP_FAIL");
  }
  return res.json();
}

export async function buildBuyTxViaPumpPortal(params: {
  walletPubkey: string;
  ca: string;
  solInLamports: number;
  slippageBps: number;
  priorityFeeMicroLamports?: number;
}): Promise<VersionedTransaction> {
  const base = getBase();
  if (!base) throw new Error("PUMPPORTAL_NOT_CONFIGURED");
  const authHeader = (getSetting("PUMP_PORTAL_AUTH") || process.env.PUMP_PORTAL_AUTH || "").trim();
  const headers = authHeader ? { authorization: authHeader } : undefined;
  // Try common endpoints: /trade then /swap
  const payload = {
    side: "buy",
    mint: params.ca,
    userPublicKey: params.walletPubkey,
    amountLamports: Math.floor(params.solInLamports),
    slippageBps: params.slippageBps,
    computeUnitPriceMicroLamports: params.priorityFeeMicroLamports
  };
  const endpoints = ["/trade", "/swap"];
  let j: any = null;
  let lastErr: any;
  for (const ep of endpoints) {
    try {
      j = await postJson(`${base}${ep}`, payload, headers);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!j) throw lastErr || new Error("PUMPPORTAL_HTTP_FAIL");
  const b64 = pickTxField(j);
  if (!b64) throw new Error("PUMPPORTAL_BAD_RESPONSE");
  const serialized = Buffer.from(b64, "base64");
  return VersionedTransaction.deserialize(serialized);
}

export async function buildSellTxViaPumpPortal(params: {
  walletPubkey: string;
  ca: string;
  amountTokens: bigint;
  slippageBps: number;
  priorityFeeMicroLamports?: number;
}): Promise<VersionedTransaction> {
  const base = getBase();
  if (!base) throw new Error("PUMPPORTAL_NOT_CONFIGURED");
  const authHeader = (getSetting("PUMP_PORTAL_AUTH") || process.env.PUMP_PORTAL_AUTH || "").trim();
  const headers = authHeader ? { authorization: authHeader } : undefined;
  const payload = {
    side: "sell",
    mint: params.ca,
    userPublicKey: params.walletPubkey,
    amountTokens: params.amountTokens.toString(),
    slippageBps: params.slippageBps,
    computeUnitPriceMicroLamports: params.priorityFeeMicroLamports
  };
  const endpoints = ["/trade", "/swap"];
  let j: any = null;
  let lastErr: any;
  for (const ep of endpoints) {
    try {
      j = await postJson(`${base}${ep}`, payload, headers);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!j) throw lastErr || new Error("PUMPPORTAL_HTTP_FAIL");
  const b64 = pickTxField(j);
  if (!b64) throw new Error("PUMPPORTAL_BAD_RESPONSE");
  const serialized = Buffer.from(b64, "base64");
  return VersionedTransaction.deserialize(serialized);
}


