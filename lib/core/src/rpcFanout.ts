/**
 * RPC Fan-Out Engine (Enhanced)
 * Send independent transactions across N wallets concurrently
 * With DRY_RUN support, idempotency, and proper error handling
 */

import {
  Connection,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';
import type { RpcFanoutOptions, EngineResult, EngineOutcome } from './types/engine';
import { isAlreadyProcessed, markExecutionStarted, markExecutionCompleted } from './idempotency';
import { createDailyJournal, logJsonLine } from './journal';

function getRpcUrl(cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): string {
  if (cluster === 'devnet') {
    const primary = process.env.HELIUS_RPC_DEVNET_URL || '';
    const secondary = process.env.SECONDARY_RPC_DEVNET_URL || '';
    return primary || secondary || process.env.PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
  }
  const primary = process.env.HELIUS_RPC_URL || '';
  const secondary = process.env.SECONDARY_RPC_URL || '';
  return primary || secondary || process.env.PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

/**
 * Execute RPC Fan-Out
 * Sends transactions concurrently across multiple wallets
 */
export async function executeRpcFanout(opts: RpcFanoutOptions): Promise<EngineResult> {
  const {
    wallets,
    buildTx,
    concurrency = 5,
    priorityFeeMicrolamports = 0,
    timeoutMs = 20000,
    dryRun = true, // Safe default!
    cluster = 'mainnet-beta',
    runId = randomUUID(),
    intentHash = 'default',
  } = opts;
  
  const connection = new Connection(getRpcUrl(cluster), 'confirmed');
  const limiter = pLimit(concurrency);
  const outcomes: EngineOutcome[] = [];
  const journal = createDailyJournal('data');
  
  logJsonLine(journal, {
    ev: 'rpc_fanout_start',
    runId,
    walletCount: wallets.length,
    concurrency,
    dryRun,
    cluster,
    priorityFeeMicrolamports,
  });
  
  await Promise.all(
    wallets.map((wallet) =>
      limiter(async () => {
        const walletPubkey = wallet.publicKey.toBase58();
        
        // Check idempotency
        if (isAlreadyProcessed({ runId, wallet: walletPubkey, intentHash })) {
          outcomes.push({
            wallet: walletPubkey,
            status: 'ERROR',
            error: 'Already processed (idempotency check)',
          });
          return;
        }
        
        // Mark as started
        markExecutionStarted({ runId, wallet: walletPubkey, intentHash });
        
        try {
          // Build transaction
          const tx = await buildTx(wallet);
          
          // Add compute budget if priority fee specified
          if (priorityFeeMicrolamports > 0) {
            tx.add(
              ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: priorityFeeMicrolamports,
              })
            );
          }
          
          // Set fee payer
          tx.feePayer = wallet.publicKey;
          
          // Get recent blockhash
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          
          // Sign transaction (server-side only!)
          await tx.sign(wallet);
          
          if (dryRun) {
            // SIMULATE ONLY - NO SEND
            const simulation = await connection.simulateTransaction(tx, {
              sigVerify: true,
            });
            
            if (simulation.value.err) {
              outcomes.push({
                wallet: walletPubkey,
                status: 'ERROR',
                error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
                simulationLogs: simulation.value.logs || [],
              });
              
              logJsonLine(journal, {
                ev: 'rpc_simulate_error',
                runId,
                wallet: walletPubkey,
                error: simulation.value.err,
                logs: simulation.value.logs?.slice(0, 5),
              });
            } else {
              outcomes.push({
                wallet: walletPubkey,
                status: 'SIMULATED',
                simulationLogs: simulation.value.logs || [],
              });
              
              logJsonLine(journal, {
                ev: 'rpc_simulate_ok',
                runId,
                wallet: walletPubkey,
                logs: simulation.value.logs?.slice(0, 5),
              });
            }
            
            markExecutionCompleted({ runId, wallet: walletPubkey, intentHash });
            return;
          }
          
          // LIVE SEND
          const signature = await connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
          
          // Confirm transaction with timeout
          const confirmation = await Promise.race([
            connection.confirmTransaction(
              {
                signature,
                blockhash,
                lastValidBlockHeight,
              },
              'confirmed'
            ),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
          ]);
          
          if (!confirmation) {
            outcomes.push({
              wallet: walletPubkey,
              signature,
              status: 'TIMEOUT',
              error: `Confirmation timeout after ${timeoutMs}ms`,
            });
            
            logJsonLine(journal, {
              ev: 'rpc_timeout',
              runId,
              wallet: walletPubkey,
              signature,
              timeoutMs,
            });
          } else if (confirmation.value.err) {
            outcomes.push({
              wallet: walletPubkey,
              signature,
              status: 'ERROR',
              error: JSON.stringify(confirmation.value.err),
            });
            
            logJsonLine(journal, {
              ev: 'rpc_error',
              runId,
              wallet: walletPubkey,
              signature,
              error: confirmation.value.err,
            });
          } else {
            outcomes.push({
              wallet: walletPubkey,
              signature,
              slot: confirmation.context.slot,
              status: 'CONFIRMED',
            });
            
            logJsonLine(journal, {
              ev: 'rpc_confirmed',
              runId,
              wallet: walletPubkey,
              signature,
              slot: confirmation.context.slot,
            });
          }
          
          markExecutionCompleted({ runId, wallet: walletPubkey, intentHash });
        } catch (error: any) {
          outcomes.push({
            wallet: walletPubkey,
            status: 'ERROR',
            error: error?.message || String(error),
          });
          
          logJsonLine(journal, {
            ev: 'rpc_exception',
            runId,
            wallet: walletPubkey,
            error: error?.message || String(error),
          });
        }
      })
    )
  );
  
  logJsonLine(journal, {
    ev: 'rpc_fanout_complete',
    runId,
    totalWallets: wallets.length,
    outcomes: {
      simulated: outcomes.filter(o => o.status === 'SIMULATED').length,
      confirmed: outcomes.filter(o => o.status === 'CONFIRMED').length,
      error: outcomes.filter(o => o.status === 'ERROR').length,
      timeout: outcomes.filter(o => o.status === 'TIMEOUT').length,
    },
  });
  
  return {
    mode: 'RPC_FANOUT',
    runId,
    outcomes,
    dryRun: !!dryRun,
    timestamp: new Date().toISOString(),
  };
}
