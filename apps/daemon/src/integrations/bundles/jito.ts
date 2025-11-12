import { VersionedTransaction, Connection } from "@solana/web3.js";
import { logger } from "@keymaker/logger";
import bs58 from "bs58";
import { getRunEnabled } from "../../guards";
import { incrementRpcErrorStreak, resetRpcErrorStreak, getRpcErrorStreak, getRpcDegraded } from "../../state";
import { hedgedSendRawTransaction } from "../../rpc";

export async function submitBundleOrRpc(
  conn: Connection,
  txs: VersionedTransaction[],
  tipLamports?: number,
  opts?: { forcePath?: "rpc"|"jito"; rpcConcurrency?: number; retry?: { attempts: number; delaysMs: number[] } }
): Promise<{ path: "jito"|"rpc"; bundleId?: string; sigs: string[]; tipLamportsUsed?: number }> {
  const jitoUrl = process.env.JITO_BLOCK_ENGINE;
  if ((opts?.forcePath === "jito") || (jitoUrl && opts?.forcePath !== "rpc")) {
    try {
      // JSON-RPC sendBundle using base58 signed transactions
      const endpoint = `${jitoUrl!.replace(/\/+$/, "")}/api/v1/bundles`;
      let bundleId: string | undefined;
      const sigs: string[] = txs.map((t) => bs58.encode(t.signatures[0]));
      const attempts = Math.max(1, opts?.retry?.attempts ?? 1);
      const delays = opts?.retry?.delaysMs ?? [];
      for (let i = 0; i < txs.length; i += 5) {
        if (!getRunEnabled()) throw new Error("RUN_DISABLED");
        const chunk = txs.slice(i, i + 5);
        const base58Arr = chunk.map((t) => bs58.encode(Buffer.from(t.serialize())));
        let sent = false;
        for (let a = 0; a < attempts; a++) {
          try {
            const body = {
              jsonrpc: "2.0",
              id: 1,
              method: "sendBundle",
              params: [base58Arr]
            };
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`JITO_HTTP_${res.status}`);
            const j = await res.json();
            const result = j?.result;
            bundleId = typeof result === "string" ? result : (result?.bundleId || result?.uuid || bundleId);
            logger.info("bundle", { op: "submit", path: "jito", bundleId });
            sent = true;
            break;
          } catch (err) {
            const d = delays[a];
            if (d) await new Promise((r) => setTimeout(r, d));
          }
        }
        if (!sent) throw new Error("JITO_BUNDLE_FAIL");
      }
      resetRpcErrorStreak();
      return { path: "jito", bundleId, sigs, tipLamportsUsed: Math.max(0, Math.floor(tipLamports ?? 0)) };
    } catch (e) {
      logger.warn?.("jito-fallback", { error: (e as Error).message });
      // fall through to RPC
    }
  }
  // RPC fallback with modest concurrency
  if (getRpcDegraded() && getRpcErrorStreak() >= 3) throw new Error("RPC_DEGRADED");
  const sigs: string[] = [];
  const concurrency = opts?.rpcConcurrency ?? 4;
  const attempts = Math.max(1, opts?.retry?.attempts ?? 1);
  const delays = opts?.retry?.delaysMs ?? [];
  let idx = 0;
  await Promise.all(new Array(concurrency).fill(0).map(async () => {
    while (idx < txs.length) {
      if (!getRunEnabled()) throw new Error("RUN_DISABLED");
      const i = idx++;
      const t = txs[i];
      const raw = Buffer.from(t.serialize());
      let lastErr: any;
      for (let a = 0; a <= attempts; a++) {
        try {
          const sig = await hedgedSendRawTransaction(raw, { skipPreflight: true, maxRetries: 3, hedgeFanout: 2, staggerMs: 50 });
          sigs.push(sig);
          resetRpcErrorStreak();
          lastErr = undefined;
          break;
        } catch (e) {
          lastErr = e;
          incrementRpcErrorStreak();
          const d = delays[a];
          if (d) await new Promise(r => setTimeout(r, d));
        }
      }
      if (lastErr) throw lastErr;
    }
  }));
  logger.info("rpc-send", { op: "submit", path: "rpc", count: txs.length });
  return { path: "rpc", sigs, tipLamportsUsed: 0 };
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


