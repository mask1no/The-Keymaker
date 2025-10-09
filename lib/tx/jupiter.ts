import 'server-only';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { logger } from '@/lib/logger';

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

interface SwapParams {
  owner: Keypair;
  inMint: string;
  outMint: string;
  inAmountLamports: number;
  slippageBps: number;
  connection: Connection;
  priorityFeeMicroLamports?: number;
}

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

/**
 * Get quote and build swap transaction from Jupiter V6
 */
export async function quoteAndBuildSwap(params: SwapParams): Promise<VersionedTransaction> {
  const {
    owner,
    inMint,
    outMint,
    inAmountLamports,
    slippageBps,
    connection,
    priorityFeeMicroLamports = 50_000,
  } = params;

  try {
    // Get quote
    const quoteResponse = await fetch(
      `${JUPITER_API_URL}/quote?` +
        new URLSearchParams({
          inputMint: inMint,
          outputMint: outMint,
          amount: inAmountLamports.toString(),
          slippageBps: slippageBps.toString(),
          onlyDirectRoutes: 'false',
          asLegacyTransaction: 'false',
        })
    );

    if (!quoteResponse.ok) {
      throw new Error(`Jupiter quote failed: ${quoteResponse.status} ${await quoteResponse.text()}`);
    }

    const quote: QuoteResponse = await quoteResponse.json();

    logger.info('Got Jupiter quote', {
      inMint,
      outMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct,
    });

    // Build swap transaction
    const swapResponse = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: owner.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: priorityFeeMicroLamports,
      }),
    });

    if (!swapResponse.ok) {
      throw new Error(`Jupiter swap build failed: ${swapResponse.status} ${await swapResponse.text()}`);
    }

    const { swapTransaction } = await swapResponse.json();

    // Deserialize transaction
    const txBuffer = Buffer.from(swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuffer);

    // Sign transaction
    tx.sign([owner]);

    // Simulate
    const simulation = await connection.simulateTransaction(tx, {
      replaceRecentBlockhash: true,
      commitment: 'processed',
    });

    if (simulation.value.err) {
      throw new Error(`Swap simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    logger.info('Built Jupiter swap TX', {
      owner: owner.publicKey.toBase58(),
      inMint,
      outMint,
      expectedOut: quote.outAmount,
    });

    return tx;
  } catch (error) {
    logger.error('Failed to build Jupiter swap', { error, params });
    throw error;
  }
}

/**
 * Get a simple quote without building transaction
 */
export async function getQuote(params: {
  inMint: string;
  outMint: string;
  inAmountLamports: number;
  slippageBps: number;
}): Promise<QuoteResponse> {
  const { inMint, outMint, inAmountLamports, slippageBps } = params;

  const response = await fetch(
    `${JUPITER_API_URL}/quote?` +
      new URLSearchParams({
        inputMint: inMint,
        outputMint: outMint,
        amount: inAmountLamports.toString(),
        slippageBps: slippageBps.toString(),
      })
  );

  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Calculate price impact from a quote
 */
export function getPriceImpact(quote: QuoteResponse): number {
  return quote.priceImpactPct;
}

