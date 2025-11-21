import { VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { hedgedSendRawTransaction } from "../../rpc";

/** Try Jito JSON-RPC sendBundle; fallback to RPC spray with clear result */
export async function submitBundleOrRpc(
  conn: Connection,
  txs: VersionedTransaction[],
  tipLamports?: number,
  opts?: { forcePath?: "jito" | "rpc" }
): Promise<{ path: "jito" | "rpc"; bundleId?: string; sigs: string[]; tipLamportsUsed?: number }> {
  const endpoint = (process.env.JITO_BLOCK_ENGINE || "").replace(/\/$/, "");
  const force = opts?.forcePath;
  const tryJito = force === "jito" || (force !== "rpc" && !!endpoint);

  if (tryJito) {
    try {
      const payload = txs.map((tx) => bs58.encode(tx.serialize()));
      const res = await fetch(`${endpoint}/api/v1/bundles`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sendBundle", params: [payload] }),
      });
      if (!res.ok) throw new Error(`JITO_HTTP_${res.status}`);
      const j = await res.json();
      if (!j?.result) throw new Error("JITO_REJECT");
      const sigs = txs.map((tx) => bs58.encode(tx.signatures[0] || Buffer.alloc(64)));
      return { path: "jito", bundleId: String(j.result), sigs, tipLamportsUsed: tipLamports || 0 };
    } catch {
      // fall through to RPC spray
    }
  }
  const sigs: string[] = [];
  for (const tx of txs) {
    const sig = await hedgedSendRawTransaction(conn, tx.serialize(), { skipPreflight: true, maxRetries: 3 });
    sigs.push(sig);
  }
  return { path: "rpc", sigs };
}

export async function confirmAll(conn: Connection, sigs: string[], timeoutMs = 15_000) {
  const t0 = Date.now();
  const pending = new Set(sigs);
  while (pending.size && Date.now() - t0 < timeoutMs) {
    await Promise.all(
      [...pending].map(async (s) => {
        const r = await conn.getSignatureStatus(s, { searchTransactionHistory: true });
        const st = r?.value?.confirmationStatus;
        if (st === "confirmed" || st === "finalized") pending.delete(s);
      })
    );
    await new Promise((r) => setTimeout(r, 1_000));
  }
  if (pending.size) throw new Error("CONFIRM_TIMEOUT");
}
