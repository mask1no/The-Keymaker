import { PublicKey } from "@solana/web3.js";

/**
 * Pump.fun launch seam.
 * Keep signatures/types here so wiring JITO + pump program is isolated.
 * Implement later with real program Ixs.
 */
export async function publishWithPumpFun(_params: { mint: string; payerPubkey: string }): Promise<{ sig: string }> {
  throw new Error("PUMPFUN_NOT_IMPLEMENTED");
}


