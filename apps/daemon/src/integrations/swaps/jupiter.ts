import { VersionedTransaction } from "@solana/web3.js";

export async function buildBuyTxViaJupiter(params: { walletPubkey: string; ca: string; solIn: number; slippageBps: number; priorityFeeMicroLamports?: number }): Promise<VersionedTransaction> {
  const { walletPubkey, ca, solIn, slippageBps, priorityFeeMicroLamports } = params;
  const base = process.env.JUP_API_BASE || "https://quote-api.jup.ag/v6";
  const amount = Math.floor(solIn * 1e9);
  const quoteRes = await fetch(`${base}/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${encodeURIComponent(ca)}&amount=${amount}&slippageBps=${slippageBps}`);
  if (!quoteRes.ok) throw new Error("JUP_QUOTE_FAIL");
  const quote = await quoteRes.json();
  const swapRes = await fetch(`${base}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: walletPubkey,
      wrapAndUnwrapSol: true,
      computeUnitPriceMicroLamports: priorityFeeMicroLamports,
      asLegacyTransaction: false
    })
  });
  if (!swapRes.ok) throw new Error("JUP_SWAP_FAIL");
  const j = await swapRes.json();
  const serialized = Buffer.from(j.swapTransaction as string, "base64");
  return VersionedTransaction.deserialize(serialized);
}


