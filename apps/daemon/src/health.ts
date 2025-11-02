import { getConn } from "./solana";
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
    const cluster = detectClusterFromUrl(process.env.RPC_URL);
    return { rpcOk: !!slot && !degraded, jitoOk: jitoEnabled, pingMs, rpcUrl: process.env.RPC_URL, cluster, listenerActive: getListenerActive(), runEnabled: getRunEnabled() } as any;
  } catch {
    const jitoEnabled = !!process.env.JITO_BLOCK_ENGINE;
    setRpcDegraded(true);
    const cluster = detectClusterFromUrl(process.env.RPC_URL);
    return { rpcOk: false, jitoOk: jitoEnabled, pingMs: -1, rpcUrl: process.env.RPC_URL, cluster, listenerActive: getListenerActive(), runEnabled: getRunEnabled() } as any;
  }
}


