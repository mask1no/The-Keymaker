import { v4 as uuid } from "uuid";
import { EventEmitter } from "events";
import { db, tasks, task_events, fills, tx_dedupe } from "./db";
import { eq } from "drizzle-orm";
import { buildSnipeTxs, buildMMPlan, submitBundle, confirmSigs } from "./solana";
import type { SnipeParams, MMParams, TaskKind } from "@keymaker/types";
import { logger } from "@keymaker/logger";
import { getRunEnabled, getTaskWallets } from "./state";

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
    await step(id, "BUILD");
    const txs = await buildOrMM(id);

    // Idempotent submit: stable hash of serialized txs
    const payload = Buffer.concat(txs.map((t: any) => Buffer.from(t.serialize())));
    const hash = require("crypto").createHash("sha256").update(payload).digest("hex");
    const prev = await db.select().from(tx_dedupe).where(eq(tx_dedupe.hash, hash));
    if ((prev as any[]).length) {
      const parsed = JSON.parse((prev as any)[0].result || "{}");
      await step(id, "DONE", { dedupe: true, sigs: parsed.sigs || [] });
      return;
    }

    if (!getRunEnabled()) { await step(id, "ABORT", { reason: "RUN_DISABLED" }); return; }
    await step(id, "SUBMIT");
    const { sigs, bundleId, targetSlot } = await submitBundle(txs);
    await step(id, "CONFIRM", { bundleId, targetSlot });
    await confirmSigs(sigs);

    // Persist dedupe record
    await db.insert(tx_dedupe).values({ hash, result: JSON.stringify({ sigs, bundleId }), created_at: Date.now() });

    // Record minimal fills mapped to wallets if we can
    const wallets = getTaskWallets(id);
    for (let i = 0; i < sigs.length; i++) {
      const sig = sigs[i];
      const wallet_pubkey = wallets[i] || "";
      await db.insert(fills).values({ task_id: id, wallet_pubkey, ca, side: "BUY", qty: 0, price: 0, sig, slot: 0, fee_lamports: 0, tip_lamports: 0, at: Date.now() });
      logger.info("fill", { taskId: id, ca, sig, wallet: wallet_pubkey });
    }

    await step(id, "SETTLE");
    await step(id, "DONE");
  });
}

async function buildOrMM(id: string) {
  const r = await db.select().from(tasks).where(eq(tasks.id, id));
  const row: any = (r as any)[0];
  return row.kind === "SNIPE" ? buildSnipeTxs(id) : buildMMPlan(id);
}

async function step(id: string, state: string, info?: any) {
  await db.update(tasks).set({ state, updated_at: Date.now() }).where(eq(tasks.id, id));
  await db.insert(task_events).values({ task_id: id, state, info: JSON.stringify(info ?? {}), at: Date.now() });
  logger.info("task", { id, state, ...(info || {}) });
  taskEvents.emit("event", { id, state, info });
}


