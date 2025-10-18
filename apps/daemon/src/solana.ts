import { Connection, VersionedTransaction, Keypair, PublicKey, TransactionMessage, SystemProgram, LAMPORTS_PER_SOL, AddressLookupTableAccount } from "@solana/web3.js";
import bs58 from "bs58";
import crypto from "crypto";
import { db, tx_dedupe } from "./db";
import { getKeypairForPubkey } from "./secrets";
import { submitBundleOrRpc } from "./jito";
import type { SnipeParams, MMParams } from "@keymaker/types";
import { logger } from "@keymaker/logger";
import { setTaskWallets } from "./state";

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
  const jitoTipLamports = Number(params.jitoTipLamports || 0);

  // Fetch wallets
  const ws = await db.execute(`SELECT pubkey FROM wallets WHERE folder_id = ? LIMIT ?`, [folderId, walletCount]) as any[];
  const out: VersionedTransaction[] = [];
  const amountLamports = Math.floor(maxSolPerWallet * LAMPORTS_PER_SOL);
  if (amountLamports <= 0) return out;

  for (const w of ws) {
    const userPk = w.pubkey as string;
    const quote = await fetchJupQuote("So11111111111111111111111111111111111111112", ca, amountLamports, slippageBps);
    const swap = await fetchJupSwap(userPk, quote, jitoTipLamports);
    const txb64 = swap.swapTransaction as string;
    const vtx = decodeSwapTx(txb64);
    // Attach signature
    const kp = await getKeypairForPubkey(userPk);
    if (!kp) throw new Error("PAYER_NOT_AVAILABLE");
    vtx.sign([kp]);
    out.push(vtx);
  }
  setTaskWallets(taskId, ws.map((r:any)=> r.pubkey as string));
  logger.info("snipe-built", { taskId, wallets: out.length, ca, maxSolPerWallet, slippageBps, jitoTipLamports });
  return out;
}
export async function buildMMPlan(_taskId: string): Promise<VersionedTransaction[]> {
  return [];
}
export async function submitBundle(txs: VersionedTransaction[], tipLamports?: number) {
  // Basic allowlist for programs in message; reject if unknown
  const allowed = new Set<string>([
    SystemProgram.programId.toBase58(),
    // SPL Token
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    // Metaplex Metadata
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    // Jupiter v6 (router program id may vary; allow later when integrated)
  ]);
  for (const t of txs) {
    const msg = t.message;
    const keys = msg.staticAccountKeys.map((k)=>k.toBase58());
    // If any instruction references a program outside allowlist, reject
    for (const ix of msg.compiledInstructions) {
      const prog = keys[ix.programIdIndex];
      if (!allowed.has(prog)) {
        throw new Error("PROGRAM_NOT_ALLOWED");
      }
    }
  }
  const r = await submitBundleOrRpc(txs, tipLamports);
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


