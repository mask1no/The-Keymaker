import { Connection, VersionedTransaction } from "@solana/web3.js";

let conn: Connection;
export function initSolana() {
  const url = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  conn = new Connection(url, { commitment: "confirmed" });
}
export function getConn() { return conn; }

export async function buildSnipeTxs(_taskId: string): Promise<VersionedTransaction[]> {
  return [];
}
export async function buildMMPlan(_taskId: string): Promise<VersionedTransaction[]> {
  return [];
}
export async function submitBundle(_txs: VersionedTransaction[]) {
  return { sigs: [] as string[], bundleId: "demo", targetSlot: 0 };
}
export async function confirmSigs(_sigs: string[]) {
  // TODO: confirmation loop with timeout
}


