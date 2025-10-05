/**
 * Jito Bundle Engine (Enhanced)
 * Submit bundles with optimal tips, poll status, classify outcomes
 */

import { randomUUID } from 'crypto';
import type { JitoBundleOptions, EngineResult, EngineOutcome } from './types/engine';
import { chunkArray } from './bundleChunker';
import { selectTipLamports, type TipFloorData } from './tipCalculator';
import { createDailyJournal, logJsonLine } from './journal';
import { Connection } from '@solana/web3.js';

// Jito regions
const JITO_REGIONS = {
  ny: 'https://ny.mainnet.block-engine.jito.wtf',
  ams: 'https://amsterdam.mainnet.block-engine.jito.wtf',
  ffm: 'https://frankfurt.mainnet.block-engine.jito.wtf',
  tokyo: 'https://tokyo.mainnet.block-engine.jito.wtf',
} as const;

type JitoRegion = keyof typeof JITO_REGIONS;

const MAX_RETRY_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 60_000; // 60 seconds
const EXPONENTIAL_BACKOFF_BASE = 1.5;

/**
 * Fetch Jito tip floor
 */
export async function fetchTipFloor(region: JitoRegion = 'ny'): Promise<TipFloorData> {
  try {
    const endpoint = JITO_REGIONS[region];
    const response = await fetch(`${endpoint}/api/v1/bundles/tip_floor`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Tip floor fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      p25: data.landed_tips_25th_percentile || 10_000,
      p50: data.landed_tips_50th_percentile || 50_000,
      p75: data.landed_tips_75th_percentile || 100_000,
      p95: data.landed_tips_95th_percentile,
    };
  } catch (error) {
    // Fallback to safe defaults
    console.warn('Failed to fetch tip floor, using defaults:', error);
    return {
      p25: 10_000,
      p50: 50_000,
      p75: 100_000,
    };
  }
}

/**
 * Submit bundle to Jito via gRPC (simplified REST for MVP)
 */
async function submitBundle(params: {
  region: JitoRegion;
  transactions: string[]; // Base64 serialized transactions
  tipLamports: number;
}): Promise<{ bundleId: string }> {
  const endpoint = JITO_REGIONS[params.region];
  
  // Note: This is simplified REST. For production, use @jito-foundation/jito-ts gRPC client
  const response = await fetch(`${endpoint}/api/v1/bundles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [params.transactions],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Bundle submission failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Jito error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  return {
    bundleId: data.result || randomUUID(),
  };
}

/**
 * Poll bundle status with exponential backoff
 */
async function pollBundleStatus(params: {
  region: JitoRegion;
  bundleId: string;
}): Promise<{ status: 'LANDED' | 'DROPPED' | 'PENDING' | 'EXPIRED'; slot?: number }> {
  const endpoint = JITO_REGIONS[params.region];
  const startTime = Date.now();
  let attempt = 0;
  
  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    try {
      const response = await fetch(`${endpoint}/api/v1/bundles/${params.bundleId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'DROPPED' };
        }
        throw new Error(`Status poll failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check bundle status
      if (data.status === 'landed' || data.confirmation_status === 'confirmed') {
        return { status: 'LANDED', slot: data.slot };
      }
      
      if (data.status === 'failed' || data.status === 'dropped') {
        return { status: 'DROPPED' };
      }
      
      // Exponential backoff
      const backoff = POLL_INTERVAL_MS * Math.pow(EXPONENTIAL_BACKOFF_BASE, attempt);
      await new Promise(resolve => setTimeout(resolve, Math.min(backoff, 5000)));
      attempt++;
      
    } catch (error) {
      console.warn(`Poll attempt ${attempt} failed:`, error);
      
      // Retry with backoff
      const backoff = POLL_INTERVAL_MS * Math.pow(EXPONENTIAL_BACKOFF_BASE, attempt);
      await new Promise(resolve => setTimeout(resolve, Math.min(backoff, 5000)));
      attempt++;
    }
  }
  
  return { status: 'EXPIRED' };
}

/**
 * Execute Jito Bundle
 */
export async function executeJitoBundle(opts: JitoBundleOptions): Promise<EngineResult> {
  const {
    transactions,
    tipLamports,
    region = 'ny',
    chunkSize = 5,
    dryRun = true,
    runId = randomUUID(),
  } = opts;
  
  const journal = createDailyJournal('data');
  const outcomes: EngineOutcome[] = [];
  
  logJsonLine(journal, {
    ev: 'jito_bundle_start',
    runId,
    txCount: transactions.length,
    region,
    dryRun,
  });
  
  // Get tip floor and calculate optimal tip
  let finalTip = tipLamports || 50_000;
  
  if (!tipLamports) {
    try {
      const tipFloor = await fetchTipFloor(region as JitoRegion);
      finalTip = selectTipLamports(tipFloor);
      
      logJsonLine(journal, {
        ev: 'jito_tip_calculated',
        runId,
        tipFloor,
        selectedTip: finalTip,
      });
    } catch (error) {
      console.warn('Failed to fetch tip floor, using default:', error);
    }
  }
  
  // Chunk transactions
  const chunks = chunkArray(transactions, chunkSize);
  
  logJsonLine(journal, {
    ev: 'jito_chunks_created',
    runId,
    totalTxs: transactions.length,
    numChunks: chunks.length,
    chunkSize,
  });
  
  if (dryRun) {
    // SIMULATION MODE - Just validate transactions
    const connection = new Connection(
      process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    for (const chunk of chunks) {
      for (const tx of chunk) {
        try {
          const simulation = await connection.simulateTransaction(tx as any, {
            sigVerify: false,
          });
          
          if (simulation.value.err) {
            outcomes.push({
              wallet: 'unknown',
              status: 'ERROR',
              error: JSON.stringify(simulation.value.err),
              simulationLogs: simulation.value.logs || [],
            });
          } else {
            outcomes.push({
              wallet: 'unknown',
              status: 'SIMULATED',
              simulationLogs: simulation.value.logs || [],
            });
            // Log simulated trade metadata if available
            try {
              const meta = (tx as any).__km_meta as { kind?: 'buy'|'sell'; inputMint?: string; outputMint?: string; inAmount?: string; outAmount?: string } | undefined;
              if (meta) {
                logJsonLine(journal, { ev:'trade_simulated', runId, side: meta.kind || 'buy', mint: meta.kind==='sell' ? meta.inputMint : meta?.outputMint, qty: Number(meta?.kind==='sell'?meta.inAmount:meta?.outAmount||'0'), price: 0 });
              }
            } catch {}
          }
        } catch (error) {
          outcomes.push({
            wallet: 'unknown',
            status: 'ERROR',
            error: (error as Error).message,
          });
        }
      }
    }
    
    logJsonLine(journal, {
      ev: 'jito_simulation_complete',
      runId,
      outcomes: outcomes.length,
    });
    
    return {
      mode: 'JITO_BUNDLE',
      runId,
      outcomes,
      dryRun: true,
      timestamp: new Date().toISOString(),
    };
  }
  
  // LIVE BUNDLE SUBMISSION
  const bundleResults: Array<{ bundleId: string; status: string; slot?: number }> = [];
  
  for (const chunk of chunks) {
    let attempt = 0;
    let submitted = false;
    
    while (attempt < MAX_RETRY_ATTEMPTS && !submitted) {
      try {
        // Serialize transactions to base64
        const serializedTxs = chunk.map((tx: any) =>
          Buffer.from(tx.serialize()).toString('base64')
        );
        
        // Submit bundle
        const { bundleId } = await submitBundle({
          region: region as JitoRegion,
          transactions: serializedTxs,
          tipLamports: finalTip,
        });
        
        logJsonLine(journal, {
          ev: 'jito_bundle_submitted',
          runId,
          bundleId,
          txCount: chunk.length,
          tip: finalTip,
          region,
        });
        
        // Poll for status
        const result = await pollBundleStatus({
          region: region as JitoRegion,
          bundleId,
        });
        
        bundleResults.push({
          bundleId,
          status: result.status,
          slot: result.slot,
        });
        
        // Add outcomes
        chunk.forEach((tx: any) => {
          outcomes.push({
            wallet: 'bundled',
            status: result.status === 'LANDED' ? 'LANDED' : result.status === 'DROPPED' ? 'DROPPED' : result.status === 'EXPIRED' ? 'TIMEOUT' : 'ERROR',
            slot: result.slot,
          });
          if (result.status === 'LANDED') {
            try {
              const meta = (tx as any).__km_meta as { kind?: 'buy'|'sell'; inputMint?: string; outputMint?: string; inAmount?: string; outAmount?: string } | undefined;
              if (meta) {
                logJsonLine(journal, {
                  ev: 'trade',
                  ts: Date.now(),
                  side: meta.kind === 'sell' ? 'sell' : 'buy',
                  mint: meta.kind === 'sell' ? (meta.inputMint || 'unknown') : (meta?.outputMint || 'unknown'),
                  qty: Number(meta?.kind === 'sell' ? (meta.inAmount || '0') : (meta?.outAmount || '0')),
                  price: (() => {
                    const inAmt = Number(meta?.inAmount || '0');
                    const outAmt = Number(meta?.outAmount || '0');
                    if (!inAmt || !outAmt) return 0;
                    return inAmt / outAmt;
                  })(),
                  fee: 0,
                });
              }
            } catch {}
          }
        });
        
        logJsonLine(journal, {
          ev: 'jito_bundle_result',
          runId,
          bundleId,
          status: result.status,
          slot: result.slot,
        });
        
        submitted = true;
      } catch (error: any) {
        attempt++;
        
        const isRetryable = 
          error.message?.includes('blockhash') ||
          error.message?.includes('leader') ||
          error.message?.includes('timeout');
        
        if (isRetryable && attempt < MAX_RETRY_ATTEMPTS) {
          const backoffMs = 1000 * Math.pow(2, attempt);
          
          logJsonLine(journal, {
            ev: 'jito_retry',
            runId,
            attempt,
            error: error.message,
            retryAfterMs: backoffMs,
          });
          
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          // Terminal error or max retries reached
          chunk.forEach(() => {
            outcomes.push({
              wallet: 'bundled',
              status: 'ERROR',
              error: error.message || String(error),
            });
          });
          
          logJsonLine(journal, {
            ev: 'jito_bundle_failed',
            runId,
            attempt,
            error: error.message,
            terminal: !isRetryable,
          });
          
          break;
        }
      }
    }
  }
  
  logJsonLine(journal, {
    ev: 'jito_bundle_complete',
    runId,
    bundles: bundleResults.length,
    outcomes: {
      landed: outcomes.filter(o => o.status === 'LANDED').length,
      dropped: outcomes.filter(o => o.status === 'DROPPED').length,
      error: outcomes.filter(o => o.status === 'ERROR').length,
    },
  });
  
  return {
    mode: 'JITO_BUNDLE',
    runId,
    outcomes,
    dryRun: false,
    timestamp: new Date().toISOString(),
  };
}
