import { v4 as uuid } from "uuid";
import { EventEmitter } from "events";
import { db, tasks, task_events } from "./db";
import { eq } from "drizzle-orm";
import { buildSnipeTxs, buildMMPlan, submitBundle, confirmSigs } from "./solana";

export const taskEvents = new EventEmitter();

export async function handleTaskCreate(msg: any) {
  const id = uuid();
  const { payload } = msg;
  await db.insert(tasks).values({
    id,
    kind: payload.mode,
    ca: payload.ca,
    folder_id: payload.params.walletFolderId,
    wallet_count: payload.params.walletCount ?? 0,
    params: JSON.stringify(payload.params),
    state: "QUEUED",
    created_at: Date.now(),
    updated_at: Date.now()
  });
  runTask(id).catch(console.error);
  return id;
}

async function runTask(id: string) {
  await step(id, "PREP");
  await step(id, "BUILD");
  const txs = await buildOrMM(id);
  await step(id, "SUBMIT");
  const { sigs, bundleId, targetSlot } = await submitBundle(txs);
  await step(id, "CONFIRM", { bundleId, targetSlot });
  await confirmSigs(sigs);
  await step(id, "SETTLE");
  await step(id, "DONE");
}

async function buildOrMM(id: string) {
  const r = await db.select().from(tasks).where(eq(tasks.id, id));
  const kind = (r as any)[0].kind;
  return kind === "SNIPE" ? buildSnipeTxs(id) : buildMMPlan(id);
}

async function step(id: string, state: string, info?: any) {
  await db.update(tasks).set({ state, updated_at: Date.now() }).where(eq(tasks.id, id));
  await db.insert(task_events).values({ task_id: id, state, info: JSON.stringify(info ?? {}), at: Date.now() });
  taskEvents.emit("event", { id, state, info });
}


