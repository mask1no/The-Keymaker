import { getSetting, execute } from "./db";
import { handleTaskCreate } from "./task-runner";
import { logger } from "@keymaker/logger";

type WatchState = {
  id: string;
  ca: string;
  folderId: string;
  walletCount: number;
  avgEntry: number; // SOL per token
  tpBps: number;
  slBps: number;
  closed: boolean;
  timer?: any;
};

const watchers = new Map<string, WatchState>();

async function fetchPriceSolPerToken(ca: string): Promise<number | null> {
  try {
    const base = process.env.JUP_API_BASE || "https://quote-api.jup.ag/v6";
    // Quote token -> SOL for a small fixed amount (1e6 atoms heuristic)
    const amount = 1_000_000;
    const url = `${base}/quote?inputMint=${encodeURIComponent(ca)}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=50`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const outLamports = Number(j?.outAmount || 0);
    if (outLamports <= 0) return null;
    // price = (outLamports lamports) / (amount tokens) in SOL units
    const price = (outLamports / 1e9) / amount;
    return price;
  } catch {
    return null;
  }
}

function withinBps(current: number, reference: number): number {
  // returns delta in basis points (current/reference - 1) * 10000
  if (reference <= 0) return 0;
  return Math.round(((current / reference) - 1) * 10000);
}

async function tick(state: WatchState) {
  if (state.closed) return;
  const price = await fetchPriceSolPerToken(state.ca);
  if (!price) return;
  const deltaBps = withinBps(price, state.avgEntry);
  if (state.tpBps > 0 && deltaBps >= state.tpBps) {
    try {
      const id = await handleTaskCreate("SELL", state.ca, {
        walletFolderId: state.folderId,
        walletCount: state.walletCount,
        percent: 100,
        slippageBps: Number(getSetting("DEFAULT_SLIPPAGE_BPS") || "500"),
        execMode: "RPC_SPRAY",
        jitterMs: [50, 150],
        cuPrice: [800, 1400]
      });
      try { logger.info("tpsl", { op: "TP", ca: state.ca, id }); } catch {}
    } finally {
      stopWatcher(state.ca);
    }
  } else if (state.slBps > 0 && deltaBps <= -Math.abs(state.slBps)) {
    try {
      const id = await handleTaskCreate("SELL", state.ca, {
        walletFolderId: state.folderId,
        walletCount: state.walletCount,
        percent: 100,
        slippageBps: Number(getSetting("DEFAULT_SLIPPAGE_BPS") || "500"),
        execMode: "RPC_SPRAY",
        jitterMs: [50, 150],
        cuPrice: [800, 1400]
      });
      try { logger.info("tpsl", { op: "SL", ca: state.ca, id }); } catch {}
    } finally {
      stopWatcher(state.ca);
    }
  }
}

export function stopWatcher(ca: string) {
  const w = watchers.get(ca);
  if (!w) return;
  w.closed = true;
  if (w.timer) clearInterval(w.timer);
  watchers.delete(ca);
}

export async function maybeStartWatcherForTask(taskId: string) {
  try {
    const tp = Number(getSetting("TPSL_TP_BPS") || "0");
    const sl = Number(getSetting("TPSL_SL_BPS") || "0");
    if (tp <= 0 && sl <= 0) return;
    const rows = await execute(`SELECT id, kind, ca, folder_id, wallet_count FROM tasks WHERE id = ? LIMIT 1`, [taskId]) as any[];
    if (!rows || !rows.length) return;
    const row: any = rows[0];
    if (String(row.kind) !== "SNIPE") return;
    const ca = String(row.ca);
    if (watchers.has(ca)) return;
    // Compute avg entry price from fills (BUY qty/price)
    const fills = await execute(`SELECT qty, price FROM fills WHERE task_id = ? AND side = 'BUY'`, [taskId]) as any[];
    let totalQty = 0;
    let totalCost = 0;
    for (const f of fills) {
      const q = Number(f.qty || 0);
      const p = Number(f.price || 0);
      if (q > 0 && p > 0) { totalQty += q; totalCost += q * p; }
    }
    const avg = totalQty > 0 ? (totalCost / totalQty) : 0;
    if (avg <= 0) return;
    const state: WatchState = {
      id: taskId,
      ca,
      folderId: String(row.folder_id),
      walletCount: Number(row.wallet_count || 0),
      avgEntry: avg,
      tpBps: tp,
      slBps: sl,
      closed: false
    };
    state.timer = setInterval(() => { void tick(state); }, 2000);
    watchers.set(ca, state);
    try { logger.info("tpsl", { op: "START", ca, tpBps: tp, slBps: sl }); } catch {}
  } catch {}
}


