/**
 * Jupiter Swap Adapter
 * Build buy/sell transactions using Jupiter aggregator
 */

import {
  Connection,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import { createDailyJournal, logJsonLine } from './journal';

const JUPITER_API_BASE = process.env.JUPITER_API_BASE || 'https://quote-api.jup.ag/v6';

interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

/**
 * Get Jupiter quote
 */
async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}): Promise<JupiterQuote> {
  const url = new URL(`${JUPITER_API_BASE}/quote`);
  url.searchParams.set('inputMint', params.inputMint);
  url.searchParams.set('outputMint', params.outputMint);
  url.searchParams.set('amount', params.amount.toString());
  url.searchParams.set('slippageBps', params.slippageBps.toString());
  url.searchParams.set('onlyDirectRoutes', 'false');
  url.searchParams.set('asLegacyTransaction', 'false');
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.status} ${await response.text()}`);
  }
  
  return response.json();
}

/**
 * Build swap transaction from quote
 */
async function buildSwapTransaction(params: {
  quote: JupiterQuote;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
  priorityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const response = await fetch(`${JUPITER_API_BASE}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: params.quote,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: params.wrapUnwrapSOL ?? true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: params.priorityFeeMicrolamports ? {
        priorityLevelWithMaxLamports: {
          maxLamports: params.priorityFeeMicrolamports,
        },
      } : undefined,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Jupiter swap build failed: ${response.status} ${await response.text()}`);
  }
  
  const { swapTransaction } = await response.json();
  
  // Deserialize the transaction
  const transactionBuf = Buffer.from(swapTransaction, 'base64');
  return VersionedTransaction.deserialize(transactionBuf);
}

/**
 * Build Jupiter swap transaction for buying
 */
export async function buildJupiterSwapTx(params: {
  wallet: Keypair;
  inputMint: string;
  outputMint: string;
  amountSol: number;
  slippageBps: number;
  cluster?: 'mainnet-beta' | 'devnet';
  priorityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const journal = createDailyJournal('data');
  
  // Convert SOL to lamports
  const amountLamports = Math.floor(params.amountSol * 1e9);
  
  logJsonLine(journal, {
    ev: 'jupiter_quote_request',
    wallet: params.wallet.publicKey.toBase58(),
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amountLamports,
    slippageBps: params.slippageBps,
  });
  
  try {
    // Get quote
    const quote = await getJupiterQuote({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: amountLamports,
      slippageBps: params.slippageBps,
    });
    
    logJsonLine(journal, {
      ev: 'jupiter_quote_received',
      wallet: params.wallet.publicKey.toBase58(),
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct,
    });
    
    // Build transaction
    const versionedTx = await buildSwapTransaction({
      quote,
      userPublicKey: params.wallet.publicKey.toBase58(),
      wrapUnwrapSOL: true,
      priorityFeeMicrolamports: params.priorityFeeMicrolamports,
    });
    // Attach minimal metadata for downstream journaling
    try {
      (versionedTx as any).__km_meta = {
        kind: 'buy',
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        inAmount: quote.inAmount, // string (lamports for buy)
        outAmount: quote.outAmount, // string (token base units)
      };
    } catch {}
    
    logJsonLine(journal, {
      ev: 'jupiter_tx_built',
      wallet: params.wallet.publicKey.toBase58(),
      instructions: undefined,
    });
    
    return versionedTx;
  } catch (error) {
    logJsonLine(journal, {
      ev: 'jupiter_error',
      wallet: params.wallet.publicKey.toBase58(),
      error: (error as Error).message,
    });
    
    throw error;
  }
}

/**
 * Build Jupiter swap transaction for selling
 */
export async function buildJupiterSellTx(params: {
  wallet: Keypair;
  inputMint: string; // Token to sell
  outputMint: string; // Usually SOL
  amountTokens: number; // Amount in token's native units
  slippageBps: number;
  minOutLamports?: number;
  cluster?: 'mainnet-beta' | 'devnet';
  priorityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const journal = createDailyJournal('data');
  
  logJsonLine(journal, {
    ev: 'jupiter_sell_quote_request',
    wallet: params.wallet.publicKey.toBase58(),
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amountTokens: params.amountTokens,
  });
  
  try {
    // Get quote
    const quote = await getJupiterQuote({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: Math.floor(params.amountTokens),
      slippageBps: params.slippageBps,
    });
    
    // Check minimum output if specified
    if (params.minOutLamports && Number(quote.outAmount) < params.minOutLamports) {
      throw new Error(
        `Output ${quote.outAmount} below minimum ${params.minOutLamports}`
      );
    }
    
    logJsonLine(journal, {
      ev: 'jupiter_sell_quote_received',
      wallet: params.wallet.publicKey.toBase58(),
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
    });
    
    // Build transaction
    const versionedTx = await buildSwapTransaction({
      quote,
      userPublicKey: params.wallet.publicKey.toBase58(),
      wrapUnwrapSOL: true,
      priorityFeeMicrolamports: params.priorityFeeMicrolamports,
    });
    try {
      (versionedTx as any).__km_meta = {
        kind: 'sell',
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        inAmount: quote.inAmount, // string (token base units)
        outAmount: quote.outAmount, // string (lamports)
      };
    } catch {}
    
    logJsonLine(journal, {
      ev: 'jupiter_sell_tx_built',
      wallet: params.wallet.publicKey.toBase58(),
      instructions: undefined,
    });
    
    return versionedTx;
  } catch (error) {
    logJsonLine(journal, {
      ev: 'jupiter_sell_error',
      wallet: params.wallet.publicKey.toBase58(),
      error: (error as Error).message,
    });
    
    throw error;
  }
}

/**
 * Simulate transaction before sending (fail fast)
 */
export async function simulateTransaction(params: {
  connection: Connection;
  transaction: Transaction;
  wallet: Keypair;
}): Promise<{ success: boolean; error?: string; logs?: string[] }> {
  const { connection, transaction, wallet } = params;
  
  try {
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign
    await transaction.sign(wallet);
    
    // Simulate
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      return {
        success: false,
        error: JSON.stringify(simulation.value.err),
        logs: simulation.value.logs || [],
      };
    }
    
    return {
      success: true,
      logs: simulation.value.logs || [],
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
