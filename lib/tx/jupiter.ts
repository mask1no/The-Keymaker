import 'server-only';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
const WSOL_MINT = 'So11111111111111111111111111111111111111112';

interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

interface BuildSwapParams {
  wallet: Keypair;
  inputMint: string;
  outputMint: string;
  amountLamports: number;
  slippageBps: number;
  priorityFeeMicrolamports?: number;
}

interface BuildSellParams {
  wallet: Keypair;
  inputMint: string;
  outputMint: string;
  amountTokens: number;
  slippageBps: number;
  priorityFeeMicrolamports?: number;
}

async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}): Promise<QuoteResponse> {
  const { inputMint, outputMint, amount, slippageBps } = params;

  const queryParams = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false',
  });

  const response = await fetch(`${JUPITER_API_URL}/quote?${queryParams}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter quote failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function buildSwapFromQuote(
  quote: QuoteResponse,
  userPublicKey: string,
  priorityFeeMicrolamports?: number,
): Promise<VersionedTransaction> {
  const body: any = {
    quoteResponse: quote,
    userPublicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    computeUnitPriceMicroLamports: 'auto',
  };

  if (priorityFeeMicrolamports) {
    body.prioritizationFeeLamports = priorityFeeMicrolamports;
  }

  const response = await fetch(`${JUPITER_API_URL}/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter swap build failed: ${response.status} ${errorText}`);
  }

  const { swapTransaction } = await response.json();
  const txBuffer = Buffer.from(swapTransaction, 'base64');
  return VersionedTransaction.deserialize(txBuffer);
}

export async function buildSwapTx(params: BuildSwapParams): Promise<VersionedTransaction> {
  const { wallet, inputMint, outputMint, amountLamports, slippageBps, priorityFeeMicrolamports } =
    params;

  const quote = await getQuote({
    inputMint,
    outputMint,
    amount: amountLamports,
    slippageBps,
  });

  const tx = await buildSwapFromQuote(quote, wallet.publicKey.toBase58(), priorityFeeMicrolamports);

  tx.sign([wallet]);

  return tx;
}

export async function buildSellTx(params: BuildSellParams): Promise<VersionedTransaction> {
  const { wallet, inputMint, outputMint, amountTokens, slippageBps, priorityFeeMicrolamports } =
    params;

  const quote = await getQuote({
    inputMint,
    outputMint,
    amount: amountTokens,
    slippageBps,
  });

  const tx = await buildSwapFromQuote(quote, wallet.publicKey.toBase58(), priorityFeeMicrolamports);

  tx.sign([wallet]);

  return tx;
}

export function getPriceImpact(quote: QuoteResponse): number {
  return quote.priceImpactPct;
}
