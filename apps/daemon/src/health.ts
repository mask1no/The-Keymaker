import { getConn } from "./solana";
import { getRunEnabled, getListenerActive } from "./state";

export async function checkHealth() {
  try {
    const t0 = Date.now();
    const slot = await getConn().getSlot();
    const pingMs = Date.now() - t0;
    const jitoEnabled = !!process.env.JITO_BLOCK_ENGINE;
    return { rpcOk: !!slot, jitoOk: jitoEnabled, pingMs, rpcUrl: process.env.RPC_URL, listenerActive: getListenerActive(), runEnabled: getRunEnabled() } as any;
  } catch {
    const jitoEnabled = !!process.env.JITO_BLOCK_ENGINE;
    return { rpcOk: false, jitoOk: jitoEnabled, pingMs: -1, rpcUrl: process.env.RPC_URL, listenerActive: getListenerActive(), runEnabled: getRunEnabled() } as any;
  }
}


