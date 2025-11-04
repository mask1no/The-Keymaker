import { v4 as uuid } from "uuid";
import { EventEmitter } from "events";
import { db, tasks, task_events, fills, tx_dedupe, execute } from "./db";
import { eq } from "drizzle-orm";
import { buildSnipeTxs, buildMMPlan, submitBundle, confirmSigs } from "./solana";
type SnipeParams = any;
type MMParams = any;
type TaskKind = any;
import { logger } from "@keymaker/logger";
import { getRunEnabled, getTaskWallets } from "./state";
import { getConn } from "./solana";

export const taskEvents = new EventEmitter();

// Per-mint lock (serialize activity on a CA)
const mintLocks = new Map<string, Promise<void>>();
function withMintLock<T>(ca: string, fn: () => Promise<T>): Promise<T> {
  const current = mintLocks.get(ca) || Promise.resolve();
  const p = current.then(fn).finally(() => {
    // Release lock if this is the tail
    if (mintLocks.get(ca) === p) mintLocks.delete(ca);
  });
  mintLocks.set(ca, p.then(() => undefined));
  return p;
}

export function onTaskEvent(cb: (ev: any) => void) {
  taskEvents.on("event", cb);
  return () => taskEvents.off("event", cb);
}

// Cancellation flags for running tasks
const cancelled = new Set<string>();
export function cancelTask(id: string) {
  cancelled.add(id);
}

function ensureNotCancelled(id: string) {
  if (cancelled.has(id)) throw new Error("TASK_CANCELLED");
}

export async function handleTaskCreate(kind: TaskKind, ca: string, params: any) {
  const id = uuid();
  await db.insert(tasks).values({
    id,
    kind,
    ca,
    folder_id: params.walletFolderId,
    wallet_count: params.walletCount ?? 0,
    params: JSON.stringify(params),
    state: "QUEUED",
    created_at: Date.now(),
    updated_at: Date.now()
  });
  runTask(id).catch(console.error);
  return id;
}

async function runTask(id: string) {
  const row = (await db.select().from(tasks).where(eq(tasks.id, id)) as any)[0];
  const ca = row.ca as string;
  await withMintLock(ca, async () => {
    await step(id, "PREP");
    try { ensureNotCancelled(id); } catch (e) { await step(id, "FAIL", { error: (e as Error).message }); return; }
    await step(id, "BUILD");
    try { ensureNotCancelled(id); } catch (e) { await step(id, "FAIL", { error: (e as Error).message }); return; }
    const txs = await buildOrMM(id);

    // Idempotent submit: stable hash of serialized txs
    const payload = Buffer.concat(txs.map((t: any) => Buffer.from(t.serialize())));
    const hash = require("crypto").createHash("sha256").update(payload).digest("hex");
    const prev = await execute(`SELECT result FROM tx_dedupe WHERE hash = ? AND created_at >= ?`, [hash, Date.now() - 5*60*1000]) as any[];
    if ((prev as any[]).length) {
      const parsed = JSON.parse((prev as any)[0].result || "{}");
      await step(id, "DONE", { dedupe: true, sigs: parsed.sigs || [] });
      return;
    }

    if (!getRunEnabled()) { await step(id, "ABORT", { reason: "RUN_DISABLED" }); return; }
    await step(id, "SUBMIT");
    try { ensureNotCancelled(id); } catch (e) { await step(id, "FAIL", { error: (e as Error).message }); return; }
    const params = JSON.parse(row.params || "{}") as SnipeParams | MMParams;
    let execMode = (params as any).execMode as ("RPC_SPRAY"|"STEALTH_STRETCH"|"JITO_LITE"|"JITO_BUNDLE"|"JITO_DIRECT") | undefined;
    let sigs: string[] = [];
    let bundleId = "";
    let targetSlot = 0;
    const tipBand = (params as any).tipLamports as [number, number] | undefined;
    const tipBySig = new Map<string, number>();
    if (execMode === "JITO_BUNDLE" || execMode === "JITO_LITE") {
      // small bundles of 2-3 with randomized tip; 1-2 slot spacing naive (sleep)
      const chunks: Array<Array<any>> = [];
      for (let i = 0; i < (txs as any[]).length; i += 3) chunks.push((txs as any[]).slice(i, i + 3));
      for (const ch of chunks) {
        let tip: number | undefined;
        if (tipBand) { const [lo, hi] = tipBand; tip = Math.floor(lo + Math.random() * Math.max(0, hi - lo)); }
        const r: any = await submitBundle(ch as any, tip, { forcePath: "jito" });
        bundleId = r.bundleId || bundleId;
        sigs.push(...r.sigs);
        if (r.path === "jito" && r.tipLamportsUsed) {
          const share = Math.floor((r.tipLamportsUsed || 0) / Math.max(1, r.sigs.length));
          for (const s of r.sigs) tipBySig.set(s, share);
        }
        await new Promise(r2 => setTimeout(r2, 800 + Math.floor(Math.random()*800)));
      }
    } else if (execMode === "JITO_DIRECT") {
      // direct jito (single tx bundles) with tip band
      for (const t of txs as any[]) {
        let tip: number | undefined;
        if (tipBand) { const [lo, hi] = tipBand; tip = Math.floor(lo + Math.random() * Math.max(0, hi - lo)); }
        const r: any = await submitBundle([t], tip, { forcePath: "jito" });
        bundleId = r.bundleId || bundleId;
        sigs.push(...r.sigs);
        if (r.path === "jito" && r.tipLamportsUsed) {
          const share = Math.floor((r.tipLamportsUsed || 0) / Math.max(1, r.sigs.length));
          for (const s of r.sigs) tipBySig.set(s, share);
        }
        await new Promise(r2 => setTimeout(r2, 200));
      }
    } else if (execMode === "STEALTH_STRETCH") {
      // 30–120s window, parallel=2
      const windowMs = 30_000 + Math.floor(Math.random() * 90_000);
      const perTxDelay = Math.floor(windowMs / Math.max(1, (txs as any[]).length));
      let idx = 0;
      await Promise.all(new Array(2).fill(0).map(async () => {
        while (idx < (txs as any[]).length) {
          const i = idx++;
          const t = (txs as any[])[i];
          const r = await submitBundle([t], undefined, { forcePath: "rpc", rpcConcurrency: 1, retry: { attempts: 0, delaysMs: [] } });
          sigs.push(...r.sigs);
          await new Promise(r2 => setTimeout(r2, perTxDelay));
        }
      }));
    } else {
      // RPC_SPRAY default path
      const rpcConc = Math.max(1, Number((params as any).rpcConcurrency ?? 6));
      const r = await submitBundle(txs, undefined, { forcePath: "rpc", rpcConcurrency: rpcConc, retry: { attempts: 2, delaysMs: [300, 900] } });
      sigs = r.sigs;
      bundleId = r.bundleId || "";
      targetSlot = r.targetSlot || 0;
    }
    await step(id, "CONFIRM", { bundleId, targetSlot });
    try { ensureNotCancelled(id); } catch (e) { await step(id, "FAIL", { error: (e as Error).message }); return; }
    const confirmTimeout = execMode === "RPC_SPRAY" ? 15_000 : 30_000;
    await confirmSigs(sigs, confirmTimeout);

    // Persist dedupe record
    await db.insert(tx_dedupe).values({ hash, result: JSON.stringify({ sigs, bundleId }), created_at: Date.now() });
    try { await execute(`DELETE FROM tx_dedupe WHERE created_at < ?`, [Date.now() - 5*60*1000]); } catch {}

    // Compute fills best-effort from confirmed transactions
    const wallets = getTaskWallets(id);
    for (let i = 0; i < sigs.length; i++) {
      const sig = sigs[i];
      const wallet_pubkey = wallets[i] || "";
      try {
        const tx = await getConn().getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 } as any);
        let qty = 0; // tokens delta (BUY positive, SELL negative)
        let price = 0; // SOL per token
        let fee_lamports = 0;
        let tip_lamports = tipBySig.get(sig) || 0;
        if (tx && tx.meta) {
          fee_lamports = Number(tx.meta.fee || 0);
          // token balances
          const pre = (tx.meta.preTokenBalances || []).find((b: any) => b.mint === ca && b.owner === wallet_pubkey);
          const post = (tx.meta.postTokenBalances || []).find((b: any) => b.mint === ca && b.owner === wallet_pubkey);
          const preUi = pre ? Number(pre.uiTokenAmount?.uiAmount || 0) : 0;
          const postUi = post ? Number(post.uiTokenAmount?.uiAmount || 0) : 0;
          qty = postUi - preUi; // can be negative on SELL
          // lamports change for fee payer (assume wallet is fee payer)
          const preLamports = (tx.meta.preBalances || [])[0] || 0;
          const postLamports = (tx.meta.postBalances || [])[0] || 0;
          const deltaLamports = postLamports - preLamports; // BUY => negative, SELL => positive
          const absQty = Math.abs(qty);
          if (absQty > 0) price = Math.abs((deltaLamports / 1e9) / qty); // SOL per token (positive)
        }
        const side = qty >= 0 ? "BUY" : "SELL";
        const qtyAbs = Math.abs(qty);
        await db.insert(fills).values({ task_id: id, wallet_pubkey, ca, side, qty: qtyAbs, price, sig, slot: Number((tx as any)?.slot || 0), fee_lamports, tip_lamports, at: Date.now() });
        // Emit FILL event immediately after insert
        await db.insert(task_events).values({ task_id: id, state: "FILL", info: JSON.stringify({ ca, side, sig, wallet: wallet_pubkey, qty: qtyAbs, price }), at: Date.now() });
        taskEvents.emit("event", { id, state: "FILL", info: { ca, side, sig, wallet: wallet_pubkey, qty: qtyAbs, price } });
        logger.info("fill", { taskId: id, ca, sig, wallet: wallet_pubkey, qty, price });
      } catch (e) {
        await db.insert(fills).values({ task_id: id, wallet_pubkey, ca, side: "BUY", qty: 0, price: 0, sig, slot: 0, fee_lamports: 0, tip_lamports: 0, at: Date.now() });
        await db.insert(task_events).values({ task_id: id, state: "FILL", info: JSON.stringify({ ca, side: "BUY", sig, wallet: wallet_pubkey, qty: 0, price: 0 }), at: Date.now() });
        taskEvents.emit("event", { id, state: "FILL", info: { ca, side: "BUY", sig, wallet: wallet_pubkey, qty: 0, price: 0 } });
        logger.warn("fill-fallback", { taskId: id, ca, sig, wallet: wallet_pubkey, error: (e as Error).message });
      }
    }

    await step(id, "SETTLE", { ca, sigs });
    await step(id, "DONE", { ca, sigs });
  });
}

async function buildOrMM(id: string) {
  const r = await db.select().from(tasks).where(eq(tasks.id, id));
  const row: any = (r as any)[0];
  if (row.kind === "SNIPE") return buildSnipeTxs(id);
  if (row.kind === "SELL") {
    const { buildSellTxs } = await import("./solana");
    return buildSellTxs(id);
  }
  return buildMMPlan(id);
}

async function step(id: string, state: string, info?: any) {
  await db.update(tasks).set({ state, updated_at: Date.now() }).where(eq(tasks.id, id));
  await db.insert(task_events).values({ task_id: id, state, info: JSON.stringify(info ?? {}), at: Date.now() });
  logger.info("task", { id, state, ...(info || {}) });
  taskEvents.emit("event", { id, state, info });
}


