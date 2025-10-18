import { VersionedTransaction, PublicKey } from "@solana/web3.js";

export async function buildBuyTxViaJupiter(params: { walletPubkey: string; ca: string; solIn: number; slippageBps: number; priorityFeeMicroLamports?: number }): Promise<VersionedTransaction> {
  // TODO: implement jupiter swap build. This is a seam for the engine.
  // For now, return an empty signed tx placeholder.
  const dummy = new Uint8Array();
  return VersionedTransaction.deserialize(dummy);
}


