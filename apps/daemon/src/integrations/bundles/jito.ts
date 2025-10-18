import { VersionedTransaction, Connection } from "@solana/web3.js";
import { submitBundleOrRpc } from "../../jito";

export async function submitBundleOrRpcShim(conn: Connection, txs: VersionedTransaction[], tipLamports?: number): Promise<{ path: "jito"|"rpc"; bundleId?: string; sigs: string[] }> {
  return submitBundleOrRpc(txs, tipLamports);
}

export async function confirmAll(conn: Connection, sigs: string[], timeoutMs: number = 30000) {
  const t0 = Date.now();
  const pending = new Set(sigs);
  while (pending.size && (Date.now() - t0) < timeoutMs) {
    await Promise.all([...pending].map(async (sig)=>{
      const r = await conn.getSignatureStatus(sig, { searchTransactionHistory: true });
      if (r && r.value && (r.value.confirmationStatus === "confirmed" || r.value.confirmationStatus === "finalized")) pending.delete(sig);
    }));
    await new Promise(r => setTimeout(r, 1000));
  }
  if (pending.size) throw new Error("CONFIRM_TIMEOUT");
}


