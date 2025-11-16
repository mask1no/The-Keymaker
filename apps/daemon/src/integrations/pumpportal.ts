import { VersionedTransaction } from "@solana/web3.js";

function base(): string {
  const b = (process.env.PUMP_PORTAL_BASE || "").trim();
  if (!b) throw new Error("PUMPPORTAL_NOT_CONFIGURED");
  return b.replace(/\/$/, "");
}

function auth(): Record<string, string> | undefined {
  const v = (process.env.PUMP_PORTAL_AUTH || "").trim();
  return v ? { authorization: v } : undefined;
}

function pickTxField(j: any): string | null {
  const cands = [
    j?.swapTransaction, j?.transaction, j?.tx, j?.txBase64, j?.encodedTransaction,
    j?.data?.swapTransaction, j?.data?.transaction, j?.data?.tx
  ];
  for (const c of cands) if (typeof c === "string" && c.length > 100) return c;
  return null;
}

async function post(ep: string, body: any) {
  const res = await fetch(`${base()}${ep}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth() || {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUMPPORTAL_HTTP_${res.status}`);
  return res.json();
}

export async function buildBuyTxViaPumpPortal(p: {
  walletPubkey: string; ca: string; solInLamports: number; slippageBps: number; priorityFeeMicroLamports?: number;
}): Promise<VersionedTransaction> {
  const payload = {
    side: "buy",
    mint: p.ca,
    userPublicKey: p.walletPubkey,
    amountLamports: p.solInLamports,
    slippageBps: p.slippageBps,
    computeUnitPriceMicroLamports: p.priorityFeeMicroLamports,
  };
  let j = null, lastErr: any;
  for (const ep of ["/trade", "/swap"]) { try { j = await post(ep, payload); break; } catch (e) { lastErr = e; } }
  if (!j) throw lastErr || new Error("PUMPPORTAL_HTTP_FAIL");
  const b64 = pickTxField(j);
  if (!b64) throw new Error("PUMPPORTAL_BAD_RESPONSE");
  return VersionedTransaction.deserialize(Buffer.from(b64, "base64"));
}

export async function buildSellTxViaPumpPortal(p: {
  walletPubkey: string; ca: string; amountTokens?: bigint; percentTokens?: number; slippageBps: number; priorityFeeMicroLamports?: number;
}): Promise<VersionedTransaction> {
  const payload = {
    side: "sell",
    mint: p.ca,
    userPublicKey: p.walletPubkey,
    amountTokens: p.amountTokens ? String(p.amountTokens) : undefined,
    percentTokens: p.percentTokens,
    slippageBps: p.slippageBps,
    computeUnitPriceMicroLamports: p.priorityFeeMicroLamports,
  };
  let j = null, lastErr: any;
  for (const ep of ["/trade", "/swap"]) { try { j = await post(ep, payload); break; } catch (e) { lastErr = e; } }
  if (!j) throw lastErr || new Error("PUMPPORTAL_HTTP_FAIL");
  const b64 = pickTxField(j);
  if (!b64) throw new Error("PUMPPORTAL_BAD_RESPONSE");
  return VersionedTransaction.deserialize(Buffer.from(b64, "base64"));
}
