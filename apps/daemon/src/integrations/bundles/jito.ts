import { VersionedTransaction, Connection } from "@solana/web3.js";
import { logger } from "@keymaker/logger";

export async function submitBundleOrRpc(conn: Connection, txs: VersionedTransaction[], tipLamports?: number): Promise<{ path: "jito"|"rpc"; bundleId?: string; sigs: string[] }> {
  const jitoUrl = process.env.JITO_BLOCK_ENGINE;
  if (jitoUrl) {
    try {
      const mod = await import("@jito-foundation/jito-js");
      const { searcherClient } = mod as any;
      const client = searcherClient(jitoUrl);
      const bs = txs.map((t) => Buffer.from(t.serialize()).toString("base64"));
      const bundle = await client.sendBundle(bs, { tip: tipLamports ?? 0 });
      logger.info("bundle", { op: "submit", path: "jito", bundleId: bundle.uuid, lamports: tipLamports ?? 0 });
      return { path: "jito", bundleId: bundle.uuid, sigs: [] };
    } catch {
      // fall through to RPC
    }
  }
  const sigs: string[] = [];
  await Promise.all(txs.map(async (t) => {
    const raw = Buffer.from(t.serialize());
    const sig = await conn.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 3 });
    sigs.push(sig);
  }));
  logger.info("rpc-send", { op: "submit", path: "rpc", count: txs.length });
  return { path: "rpc", sigs };
}

export async function confirmAll(conn: Connection, sigs: string[], timeoutMs: number = 15000) {
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


