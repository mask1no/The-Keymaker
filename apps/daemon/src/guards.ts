import { VersionedTransaction, SystemProgram } from "@solana/web3.js";
import { getSetting } from "./db";

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
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" // Metaplex Metadata
  ]);
  for (const t of txs) {
    const msg = t.message;
    const keys = msg.staticAccountKeys.map((k)=>k.toBase58());
    for (const ix of msg.compiledInstructions) {
      const prog = keys[ix.programIdIndex];
      if (!allowed.has(prog)) throw new Error("PROGRAM_NOT_ALLOWED");
    }
  }
}

let RUN_ENABLED = true;
export function setRunEnabled(b: boolean) { RUN_ENABLED = b; }
export function getRunEnabled() { return RUN_ENABLED; }


