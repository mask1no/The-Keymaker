import { VersionedTransaction, SystemProgram } from "@solana/web3.js";
import { getSetting } from "./db";
import { getRunEnabled as getRunEnabledState, setRunEnabled as setRunEnabledState } from "./state";
import { logger } from "@keymaker/logger";

export function getCaps() {
  return {
    maxTxSol: Number(getSetting("MAX_TX_SOL") || 1),
    maxSolPerMin: Number(getSetting("MAX_SOL_PER_MIN") || 10),
    maxSessionSol: Number(getSetting("MAX_SESSION_SOL") || 50)
  };
}

export function programAllowlistCheck(txs: VersionedTransaction[]) {
  const allowed = new Set<string>([
    SystemProgram.programId.toBase58(),
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", // Metaplex Metadata
    "ComputeBudget111111111111111111111111111111", // Compute Budget
  ]);
  const strictJup = (process.env.JUP_ROUTER_PROGRAM || process.env.JUP_ROUTER || "").trim();
  let warnedLoose = false;
  for (const t of txs) {
    const msg = t.message;
    const keys = msg.staticAccountKeys.map((k)=>k.toBase58());
    for (const ix of msg.compiledInstructions) {
      const prog = keys[ix.programIdIndex];
      if (allowed.has(prog)) continue;
      const isJup = strictJup ? (prog === strictJup) : prog.startsWith("JUP");
      if (!isJup) throw new Error("PROGRAM_NOT_ALLOWED");
      if (!strictJup && !warnedLoose) { warnedLoose = true; try { logger.warn("allowlist", { jup: "loose", msg: "JUP* accepted; set JUP_ROUTER_PROGRAM for strict match" }); } catch {} }
    }
  }
}

// Kill-switch passthroughs to unified state
export function setRunEnabled(b: boolean) { setRunEnabledState(b); }
export function getRunEnabled() { return getRunEnabledState(); }

// --- Caps enforcement (per-tx, per-minute, per-session) ---
const minuteSpend: Array<{ at: number; lamports: number }> = [];
let sessionSpendLamports = 0;

function pruneMinuteWindow(now: number) {
  while (minuteSpend.length && (now - minuteSpend[0].at) > 60_000) minuteSpend.shift();
}

export function enforceTxMax(lamports: number) {
  const { maxTxSol } = getCaps();
  if (lamports > Math.floor(maxTxSol * 1e9)) throw new Error("MAX_TX_SOL_EXCEEDED");
}

export function checkAndConsumeSpend(lamports: number) {
  const now = Date.now();
  pruneMinuteWindow(now);
  const { maxSolPerMin, maxSessionSol } = getCaps();
  const minuteSoFar = minuteSpend.reduce((a, b) => a + b.lamports, 0);
  if (minuteSoFar + lamports > Math.floor(maxSolPerMin * 1e9)) throw new Error("MAX_SOL_PER_MIN_EXCEEDED");
  if (sessionSpendLamports + lamports > Math.floor(maxSessionSol * 1e9)) throw new Error("MAX_SESSION_SOL_EXCEEDED");
  minuteSpend.push({ at: now, lamports });
  sessionSpendLamports += lamports;
}



