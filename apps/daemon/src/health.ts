import { getConn } from "./solana";
import { getRpcPool, getPrimaryConn } from "./rpc";
import { getRunEnabled, getListenerActive, setRpcDegraded, getRpcDegraded } from "./state";

function detectClusterFromUrl(url: string | undefined): "mainnet"|"devnet"|"testnet"|"unknown" {
  if (!url) return "unknown";
  const u = url.toLowerCase();
  if (u.includes("devnet")) return "devnet";
  if (u.includes("testnet")) return "testnet";
  if (u.includes("mainnet")) return "mainnet";
  return "unknown";
}

export async function checkHealth() {
  try {
    const t0 = Date.now();
    const slot = await getConn().getSlot();
    const pingMs = Date.now() - t0;
    const jitoEnabled = !!process.env.JITO_BLOCK_ENGINE;
    const degraded = pingMs > 2000;
    setRpcDegraded(degraded);
    const pool = getRpcPool();
    const primaryUrl = (getPrimaryConn() as any)?._rpcEndpoint || process.env.RPC_URL;
    const cluster = detectClusterFromUrl(primaryUrl);
    return { rpcOk: !!slot && !degraded, jitoOk: jitoEnabled, pingMs, rpcUrl: primaryUrl, rpcPoolSize: pool.length, cluster, listenerActive: getListenerActive(), runEnabled: getRunEnabled() } as any;
  } catch {
    const jitoEnabled = !!process.env.JITO_BLOCK_ENGINE;
    setRpcDegraded(true);
    const pool = getRpcPool();
    const primaryUrl = (getPrimaryConn() as any)?._rpcEndpoint || process.env.RPC_URL;
    const cluster = detectClusterFromUrl(primaryUrl);
    return { rpcOk: false, jitoOk: jitoEnabled, pingMs: -1, rpcUrl: primaryUrl, rpcPoolSize: pool.length, cluster, listenerActive: getListenerActive(), runEnabled: getRunEnabled() } as any;
  }
}


