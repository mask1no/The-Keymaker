import { getConn } from "./solana";

export async function checkHealth() {
  try {
    const t0 = Date.now();
    const slot = await getConn().getSlot();
    const pingMs = Date.now() - t0;
    return { rpcOk: !!slot, jitoOk: true, pingMs };
  } catch {
    return { rpcOk: false, jitoOk: false, pingMs: -1 };
  }
}


