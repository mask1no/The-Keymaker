import { Connection, VersionedTransaction, Keypair, PublicKey, TransactionMessage, SystemProgram, LAMPORTS_PER_SOL, AddressLookupTableAccount } from "@solana/web3.js";
import bs58 from "bs58";
import crypto from "crypto";
import { db, tx_dedupe } from "./db";
import { getKeypairForPubkey } from "./secrets";
import { submitBundleOrRpc } from "./integrations/bundles/jito";
import type { SnipeParams, MMParams, SellParams } from "@keymaker/types";
import { logger } from "@keymaker/logger";
import { setTaskWallets } from "./state";
import { enforceTxMax, checkAndConsumeSpend, programAllowlistCheck } from "./guards";
import { getRpcDegraded } from "./state";

// Jupiter v6 helpers
async function fetchJupQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number) {
  const base = process.env.JUP_API_BASE || "https://quote-api.jup.ag/v6";
  const url = `${base}/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("JUP_QUOTE_FAIL");
  return res.json();
}

async function fetchJupSwap(userPublicKey: string, quoteResponse: any, computeUnitPriceMicroLamports?: number) {
  const base = process.env.JUP_SWAP_BASE || "https://quote-api.jup.ag/v6";
  const res = await fetch(`${base}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      computeUnitPriceMicroLamports,
      asLegacyTransaction: false
    })
  });
  if (!res.ok) throw new Error("JUP_SWAP_FAIL");
  return res.json();
}

function decodeSwapTx(base64Tx: string): VersionedTransaction {
  const buf = Buffer.from(base64Tx, "base64");
  return VersionedTransaction.deserialize(buf);
}

let conn: Connection;
export function initSolana() {
  const url = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  conn = new Connection(url, { commitment: "confirmed" });
}
export function getConn() { return conn; }

export async function buildSnipeTxs(taskId: string): Promise<VersionedTransaction[]> {
  // Load task
  const r = await db.execute(`SELECT * FROM tasks WHERE id = ?`, [taskId]) as any[];
  if (!r.length) return [];
  const row: any = r[0];
  const params = JSON.parse(row.params || "{}");
  const ca = row.ca as string;
  const folderId = params.walletFolderId as string;
  const walletCount = Number(params.walletCount || 0);
  const maxSolPerWallet = Number(params.maxSolPerWallet || 0);
  const slippageBps = Number(params.slippageBps || 50);
  const cuBand = params.cuPrice as [number, number] | undefined;
  const tipBand = params.tipLamports as [number, number] | undefined;
  const jitterBand = params.jitterMs as [number, number] | undefined;

  // Fetch wallets
  const ws = await db.execute(`SELECT pubkey FROM wallets WHERE folder_id = ? LIMIT ?`, [folderId, walletCount]) as any[];
  const out: VersionedTransaction[] = [];
  const amountLamports = Math.floor(maxSolPerWallet * LAMPORTS_PER_SOL);
  if (amountLamports <= 0) return out;

  for (const w of ws) {
    const userPk = w.pubkey as string;
    // per-wallet jitter
    if (jitterBand) {
      const [lo, hi] = jitterBand;
      const wait = Math.floor(lo + Math.random() * Math.max(0, hi - lo));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }
    // caps
    enforceTxMax(amountLamports);
    const quote = await fetchJupQuote("So11111111111111111111111111111111111111112", ca, amountLamports, slippageBps);
    // randomize CU price within band (microLamports)
    let cuPriceMicro: number | undefined = undefined;
    if (cuBand) {
      const [lo, hi] = cuBand;
      cuPriceMicro = Math.floor(lo + Math.random() * Math.max(0, hi - lo));
    }
    const swap = await fetchJupSwap(userPk, quote, cuPriceMicro);
    const txb64 = swap.swapTransaction as string;
    const vtx = decodeSwapTx(txb64);
    // basic allowlist check prior to signing
    programAllowlistCheck([vtx]);
    // Attach signature
    const kp = await getKeypairForPubkey(userPk);
    if (!kp) throw new Error("PAYER_NOT_AVAILABLE");
    vtx.sign([kp]);
    out.push(vtx);
    // consume budget only after we have a signed tx
    checkAndConsumeSpend(amountLamports);
  }
  setTaskWallets(taskId, ws.map((r:any)=> r.pubkey as string));
  logger.info("snipe-built", { taskId, wallets: out.length, ca, maxSolPerWallet, slippageBps, cuBand, tipBand, jitterBand });
  return out;
}
export async function buildMMPlan(_taskId: string): Promise<VersionedTransaction[]> {
  return [];
}

export async function buildSellTxs(taskId: string): Promise<VersionedTransaction[]> {
  // Load task
  const r = await db.execute(`SELECT * FROM tasks WHERE id = ?`, [taskId]) as any[];
  if (!r.length) return [];
  const row: any = r[0];
  const params = JSON.parse(row.params || "{}") as SellParams;
  const ca = row.ca as string;
  const folderId = params.walletFolderId as string;
  const walletCount = Number(params.walletCount || 0);
  const percent = Math.min(100, Math.max(1, Number(params.percent || 100)));
  const slippageBps = Number(params.slippageBps || 50);
  const cuBand = params.cuPrice as [number, number] | undefined;
  const jitterBand = params.jitterMs as [number, number] | undefined;

  const ws = await db.execute(`SELECT pubkey FROM wallets WHERE folder_id = ? LIMIT ?`, [folderId, walletCount]) as any[];
  const out: VersionedTransaction[] = [];
  for (const w of ws) {
    const userPk = w.pubkey as string;
    // per-wallet jitter
    if (jitterBand) {
      const [lo, hi] = jitterBand;
      const wait = Math.floor(lo + Math.random() * Math.max(0, hi - lo));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }
    // Determine token balance and amount to sell (in smallest units)
    const owner = new PublicKey(userPk);
    const connUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
    // Fetch token accounts and balance
    let tokenAmountRaw = 0n;
    let decimals = 6;
    try {
      const accs = await conn.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(ca) });
      const info: any = accs.value[0]?.account?.data?.parsed?.info?.tokenAmount;
      if (info) {
        decimals = Number(info.decimals || 6);
        const rawStr = info.amount as string; // string integer
        const raw = BigInt(rawStr);
        tokenAmountRaw = (raw * BigInt(Math.floor(percent))) / BigInt(100);
      }
    } catch {}
    if (tokenAmountRaw <= 0n) continue;
    // Build quote amount in base units of CA (output = SOL)
    // Jupiter expects inputMint=CA, outputMint=SOL, amount in atomics
    const quote = await fetchJupQuote(ca, "So11111111111111111111111111111111111111112", Number(tokenAmountRaw), slippageBps);
    let cuPriceMicro: number | undefined = undefined;
    if (cuBand) { const [lo, hi] = cuBand; cuPriceMicro = Math.floor(lo + Math.random() * Math.max(0, hi - lo)); }
    const swap = await fetchJupSwap(userPk, quote, cuPriceMicro);
    const vtx = decodeSwapTx(swap.swapTransaction as string);
    programAllowlistCheck([vtx]);
    const kp = await getKeypairForPubkey(userPk);
    if (!kp) throw new Error("PAYER_NOT_AVAILABLE");
    vtx.sign([kp]);
    out.push(vtx);
  }
  setTaskWallets(taskId, ws.map((r:any)=> r.pubkey as string));
  logger.info("sell-built", { taskId, wallets: out.length, ca, percent, slippageBps });
  return out;
}
export async function submitBundle(txs: VersionedTransaction[], tipLamports?: number) {
  // Program allowlist
  programAllowlistCheck(txs);
  // Health gating: if RPC degraded, pause submit if more than 4 buffered txs
  if (getRpcDegraded() && txs.length > 4) {
    throw new Error("RPC_DEGRADED");
  }
  const r = await submitBundleOrRpc(conn, txs, tipLamports);
  logger.info("submit", { path: r.path, bundleId: r.bundleId, count: txs.length });
  return { sigs: r.sigs, bundleId: r.bundleId ?? "", targetSlot: 0 };
}
export async function confirmSigs(sigs: string[]) {
  const timeoutMs = 30_000;
  const t0 = Date.now();
  const pending = new Set(sigs);
  while (pending.size && (Date.now() - t0) < timeoutMs) {
    const results = await Promise.allSettled(
      [...pending].map(async (sig) => {
        const r = await conn.getSignatureStatus(sig, { searchTransactionHistory: true });
        if (r && r.value && (r.value.confirmationStatus === "confirmed" || r.value.confirmationStatus === "finalized")) {
          pending.delete(sig);
        }
      })
    );
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (pending.size) throw new Error("CONFIRM_TIMEOUT");
}


