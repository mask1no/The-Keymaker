import { VersionedTransaction } from "@solana/web3.js";
import { getConn } from "./solana";
import { logger } from "@keymaker/logger";

export async function submitBundleOrRpc(txs: VersionedTransaction[], tipLamports?: number): Promise<{ path: "jito" | "rpc"; bundleId?: string; sigs: string[] }> {
  const conn = getConn();
  const jitoUrl = process.env.JITO_BLOCK_ENGINE_URL;
  if (jitoUrl) {
    try {
      // Attempt dynamic import so the dependency is optional
      const mod = await import("@jito-foundation/jito-js");
      const { searcherClient } = mod;
      const client = searcherClient(jitoUrl);
      // Serialize txs to base64
      const bs = txs.map((t) => Buffer.from(t.serialize()).toString("base64"));
      const bundle = await client.sendBundle(bs, { tip: tipLamports ?? 0 });
      logger.info("jito-bundle", { bundleId: bundle.uuid, count: txs.length, tipLamports: tipLamports ?? 0 });
      // Jito won't return sigs; we fallback to extracting from txs pre-send (not available). Return empty sigs here.
      return { path: "jito", bundleId: bundle.uuid, sigs: [] };
    } catch {
      // Fall through to RPC
    }
  }
  const sigs: string[] = [];
  for (const t of txs) {
    const raw = Buffer.from(t.serialize());
    const sig = await conn.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 3 });
    sigs.push(sig);
  }
  logger.info("rpc-send", { count: txs.length, sigsCount: sigs.length });
  return { path: "rpc", sigs };
}


