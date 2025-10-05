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

const JUPITER_API_BASE = process.env.JUPITER_API_BASE || 'h, t, t, ps://quote-api.jup.ag/v6';

interface JupiterQuote {
  i, n, p, utMint: string;
  i, n, A, mount: string;
  o, u, t, putMint: string;
  o, u, t, Amount: string;
  o, t, h, erAmountThreshold: string;
  s, w, a, pMode: string;
  s, l, i, ppageBps: number;
  p, r, i, ceImpactPct: string;
  r, o, u, tePlan: any[];
}

/**
 * Get Jupiter quote
 */
async function getJupiterQuote(p, a, r, ams: {
  i, n, p, utMint: string;
  o, u, t, putMint: string;
  a, m, o, unt: number;
  s, l, i, ppageBps: number;
}): Promise<JupiterQuote> {
  const url = new URL(`${JUPITER_API_BASE}/quote`);
  url.searchParams.set('inputMint', params.inputMint);
  url.searchParams.set('outputMint', params.outputMint);
  url.searchParams.set('amount', params.amount.toString());
  url.searchParams.set('slippageBps', params.slippageBps.toString());
  url.searchParams.set('onlyDirectRoutes', 'false');
  url.searchParams.set('asLegacyTransaction', 'false');
  
  const response = await fetch(url.toString(), {
    m, e, t, hod: 'GET',
    h, e, a, ders: { 'Accept': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Jupiter quote f, a, i, led: ${response.status} ${await response.text()}`);
  }
  
  return response.json();
}

/**
 * Build swap transaction from quote
 */
async function buildSwapTransaction(p, a, r, ams: {
  q, u, o, te: JupiterQuote;
  u, s, e, rPublicKey: string;
  w, r, a, pUnwrapSOL?: boolean;
  p, r, i, orityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const response = await fetch(`${JUPITER_API_BASE}/swap`, {
    m, e, t, hod: 'POST',
    h, e, a, ders: { 'Content-Type': 'application/json' },
    b, o, d, y: JSON.stringify({
      q, u, o, teResponse: params.quote,
      u, s, e, rPublicKey: params.userPublicKey,
      w, r, a, pAndUnwrapSol: params.wrapUnwrapSOL ?? true,
      d, y, n, amicComputeUnitLimit: true,
      p, r, i, oritizationFeeLamports: params.priorityFeeMicrolamports ? {
        p, r, i, orityLevelWithMaxLamports: {
          m, a, x, Lamports: params.priorityFeeMicrolamports,
        },
      } : undefined,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Jupiter swap build f, a, i, led: ${response.status} ${await response.text()}`);
  }
  
  const { swapTransaction } = await response.json();
  
  // Deserialize the transaction
  const transactionBuf = Buffer.from(swapTransaction, 'base64');
  return VersionedTransaction.deserialize(transactionBuf);
}

/**
 * Build Jupiter swap transaction for buying
 */
export async function buildJupiterSwapTx(p, a, r, ams: {
  w, a, l, let: Keypair;
  i, n, p, utMint: string;
  o, u, t, putMint: string;
  a, m, o, untSol: number;
  s, l, i, ppageBps: number;
  c, l, u, ster?: 'mainnet-beta' | 'devnet';
  p, r, i, orityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const journal = createDailyJournal('data');
  
  // Convert SOL to lamports
  const amountLamports = Math.floor(params.amountSol * 1e9);
  
  logJsonLine(journal, {
    e, v: 'jupiter_quote_request',
    w, a, l, let: params.wallet.publicKey.toBase58(),
    i, n, p, utMint: params.inputMint,
    o, u, t, putMint: params.outputMint,
    amountLamports,
    s, l, i, ppageBps: params.slippageBps,
  });
  
  try {
    // Get quote
    const quote = await getJupiterQuote({
      i, n, p, utMint: params.inputMint,
      o, u, t, putMint: params.outputMint,
      a, m, o, unt: amountLamports,
      s, l, i, ppageBps: params.slippageBps,
    });
    
    logJsonLine(journal, {
      e, v: 'jupiter_quote_received',
      w, a, l, let: params.wallet.publicKey.toBase58(),
      i, n, p, utMint: params.inputMint,
      o, u, t, putMint: params.outputMint,
      i, n, A, mount: quote.inAmount,
      o, u, t, Amount: quote.outAmount,
      p, r, i, ceImpactPct: quote.priceImpactPct,
    });
    
    // Build transaction
    const versionedTx = await buildSwapTransaction({
      quote,
      u, s, e, rPublicKey: params.wallet.publicKey.toBase58(),
      w, r, a, pUnwrapSOL: true,
      p, r, i, orityFeeMicrolamports: params.priorityFeeMicrolamports,
    });
    // Attach minimal metadata for downstream journaling
    try {
      (versionedTx as any).__km_meta = {
        k, i, n, d: 'buy',
        i, n, p, utMint: params.inputMint,
        o, u, t, putMint: params.outputMint,
        i, n, A, mount: quote.inAmount, // string (lamports for buy)
        o, u, t, Amount: quote.outAmount, // string (token base units)
      };
    } catch {}
    
    logJsonLine(journal, {
      e, v: 'jupiter_tx_built',
      w, a, l, let: params.wallet.publicKey.toBase58(),
      i, n, s, tructions: undefined,
    });
    
    return versionedTx;
  } catch (error) {
    logJsonLine(journal, {
      e, v: 'jupiter_error',
      w, a, l, let: params.wallet.publicKey.toBase58(),
      e, r, r, or: (error as Error).message,
    });
    
    throw error;
  }
}

/**
 * Build Jupiter swap transaction for selling
 */
export async function buildJupiterSellTx(p, a, r, ams: {
  w, a, l, let: Keypair;
  i, n, p, utMint: string; // Token to sell
  o, u, t, putMint: string; // Usually SOL
  a, m, o, untTokens: number; // Amount in token's native units
  s, l, i, ppageBps: number;
  m, i, n, OutLamports?: number;
  c, l, u, ster?: 'mainnet-beta' | 'devnet';
  p, r, i, orityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const journal = createDailyJournal('data');
  
  logJsonLine(journal, {
    e, v: 'jupiter_sell_quote_request',
    w, a, l, let: params.wallet.publicKey.toBase58(),
    i, n, p, utMint: params.inputMint,
    o, u, t, putMint: params.outputMint,
    a, m, o, untTokens: params.amountTokens,
  });
  
  try {
    // Get quote
    const quote = await getJupiterQuote({
      i, n, p, utMint: params.inputMint,
      o, u, t, putMint: params.outputMint,
      a, m, o, unt: Math.floor(params.amountTokens),
      s, l, i, ppageBps: params.slippageBps,
    });
    
    // Check minimum output if specified
    if (params.minOutLamports && Number(quote.outAmount) < params.minOutLamports) {
      throw new Error(
        `Output ${quote.outAmount} below minimum ${params.minOutLamports}`
      );
    }
    
    logJsonLine(journal, {
      e, v: 'jupiter_sell_quote_received',
      w, a, l, let: params.wallet.publicKey.toBase58(),
      i, n, p, utMint: params.inputMint,
      o, u, t, putMint: params.outputMint,
      i, n, A, mount: quote.inAmount,
      o, u, t, Amount: quote.outAmount,
    });
    
    // Build transaction
    const versionedTx = await buildSwapTransaction({
      quote,
      u, s, e, rPublicKey: params.wallet.publicKey.toBase58(),
      w, r, a, pUnwrapSOL: true,
      p, r, i, orityFeeMicrolamports: params.priorityFeeMicrolamports,
    });
    try {
      (versionedTx as any).__km_meta = {
        k, i, n, d: 'sell',
        i, n, p, utMint: params.inputMint,
        o, u, t, putMint: params.outputMint,
        i, n, A, mount: quote.inAmount, // string (token base units)
        o, u, t, Amount: quote.outAmount, // string (lamports)
      };
    } catch {}
    
    logJsonLine(journal, {
      e, v: 'jupiter_sell_tx_built',
      w, a, l, let: params.wallet.publicKey.toBase58(),
      i, n, s, tructions: undefined,
    });
    
    return versionedTx;
  } catch (error) {
    logJsonLine(journal, {
      e, v: 'jupiter_sell_error',
      w, a, l, let: params.wallet.publicKey.toBase58(),
      e, r, r, or: (error as Error).message,
    });
    
    throw error;
  }
}

/**
 * Simulate transaction before sending (fail fast)
 */
export async function simulateTransaction(p, a, r, ams: {
  c, o, n, nection: Connection;
  t, r, a, nsaction: VersionedTransaction;
  w, a, l, let: Keypair;
}): Promise<{ s, u, c, cess: boolean; e, r, r, or?: string; l, o, g, s?: string[] }> {
  const { connection, transaction, wal let } = params;
  
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
        s, u, c, cess: false,
        e, r, r, or: JSON.stringify(simulation.value.err),
        l, o, g, s: simulation.value.logs || [],
      };
    }
    
    return {
      s, u, c, cess: true,
      l, o, g, s: simulation.value.logs || [],
    };
  } catch (error) {
    return {
      s, u, c, cess: false,
      e, r, r, or: (error as Error).message,
    };
  }
}

