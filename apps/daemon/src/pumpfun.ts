import { PublicKey } from "@solana/web3.js";

export async function createToken(_: {
  name: string;
  symbol: string;
  decimals: 6 | 9;
  metadataUri: string;
  payer: Uint8Array;
}): Promise<{ mint: PublicKey; sig: string }> {
  throw new Error("pump.fun client not implemented yet");
}

export async function publishToken(_params: { mint: PublicKey; payer: Uint8Array }): Promise<{ sig: string }> {
  throw new Error("pump.fun publish not implemented yet");
}


