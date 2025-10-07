/**
 * RPC Fan-Out Engine (Enhanced)
 * Send independent transactions across N wallets concurrently
 * With DRY_RUN support, idempotency, and proper error handling
 */

import { Connection, ComputeBudgetProgram, VersionedTransaction } from '@solana/web3.js';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';
import type { RpcFanoutOptions, EngineResult, EngineOutcome } from './types/engine';
import { isAlreadyProcessed, markExecutionStarted, markExecutionCompleted } from './idempotency';
import { createDailyJournal, logJsonLine, journalTrade } from './journal';

function getRpcUrl(cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): string {
  if (cluster === 'devnet') {
    const primary = process.env.HELIUS_RPC_DEVNET_URL || '';
    const secondary = process.env.SECONDARY_RPC_DEVNET_URL || '';
    return primary || secondary || process.env.PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
  }
  const primary = process.env.HELIUS_RPC_URL || '';
  const secondary = process.env.SECONDARY_RPC_URL || '';
  return (
    primary || secondary || process.env.PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
  );
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
  const jitterMinMs = 5;
  const jitterMaxMs = 40;

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
        const groupIdFromIntent =
          intentHash && intentHash.split(':').length > 1 ? intentHash.split(':')[1] : undefined;
        // Small jitter to avoid clumping
        const jitter = Math.floor(Math.random() * (jitterMaxMs - jitterMinMs + 1)) + jitterMinMs;
        if (!dryRun) await new Promise((r) => setTimeout(r, jitter));

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
          // Build transaction (with optional priority fee CU params in builder)
          const vtx = (await buildTx(wallet)) as unknown as VersionedTransaction;
          // Jupiter build includes prioritization if requested; do not mutate instructions
          // Sign the versioned transaction with the wallet
          vtx.sign([wallet]);

          if (dryRun) {
            // SIMULATE ONLY - NO SEND
            const simulation = await connection.simulateTransaction(vtx, {
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

          // LIVE SEND with idempotency backed by message hash and basic retry
          const raw = vtx.serialize();
          let msgHashHex: string | null = null;
          try {
            const { stableStringify, sha256Hex } = await import('@/lib/util/jsonStableHash');
            // Canonical hash: stable stringify of core message fields
            const core = {
              message: Buffer.from(vtx.message.serialize()).toString('base64'),
              // optional: include first account+recent blockhash in case of rebuilds
            };
            msgHashHex = sha256Hex(stableStringify(core));
            // Record in sqlite if not present
            try {
              const { db } = await import('@/lib/db');
              const d = await db;
              const row = await d.get('SELECT signature FROM tx_dedupe WHERE msgHash = ?', [
                msgHashHex,
              ]);
              if (row?.signature) {
                outcomes.push({
                  wallet: walletPubkey,
                  status: 'CONFIRMED',
                  signature: row.signature,
                });
                return;
              }
              await d.run(
                'INSERT OR IGNORE INTO tx_dedupe (msgHash, firstSeenAt, status) VALUES (?, ?, ?)',
                [msgHashHex, Date.now(), 'pending'],
              );
            } catch {}
          } catch {}
          let signature: string | null = null;
          let attempts = 0;
          const maxAttempts = 3;
          while (attempts < maxAttempts && !signature) {
            try {
              signature = await connection.sendRawTransaction(raw, {
                skipPreflight: false,
                maxRetries: 3,
              });
            } catch (err: any) {
              const msg = String(err?.message || err);
              const retryable =
                /BlockhashNotFound|AccountInUse|WouldExceedMaxAccountCostLimit/i.test(msg);
              if (retryable) {
                attempts++;
                // refresh blockhash and re-sign
                const latest = await connection.getLatestBlockhash('finalized');
                try {
                  // Recreate vtx message by deserialization and re-sign; if builder embeds blockhash, rebuild instead
                  // Fallback: rebuild tx
                  const rebuilt = (await buildTx(wallet)) as unknown as VersionedTransaction;
                  rebuilt.sign([wallet]);
                  signature = await connection.sendRawTransaction(rebuilt.serialize(), {
                    skipPreflight: false,
                    maxRetries: 3,
                  });
                } catch {
                  await new Promise((r) => setTimeout(r, 200 * attempts));
                }
              } else {
                throw err;
              }
            }
          }
          if (!signature) throw new Error('send_failed');
          if (msgHashHex) {
            try {
              const { db } = await import('@/lib/db');
              const d = await db;
              await d.run('UPDATE tx_dedupe SET status = ?, signature = ? WHERE msgHash = ?', [
                'sent',
                signature,
                msgHashHex,
              ]);
            } catch {}
          }

          // Confirm transaction with timeout
          const confirmation = await Promise.race([
            connection.confirmTransaction(signature, 'confirmed'),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
          ]);

          if (!confirmation) {
            outcomes.push({
              wallet: walletPubkey,
              signature,
              status: 'TIMEOUT',
              error: `Confirmation timeout after ${timeoutMs}
ms`,
            });

            logJsonLine(journal, {
              ev: 'rpc_timeout',
              runId,
              wallet: walletPubkey,
              signature,
              timeoutMs,
              groupId: groupIdFromIntent,
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
              groupId: groupIdFromIntent,
            });
          } else {
            // Extract quote metadata if present
            const meta = (vtx as any).__km_meta as
              | {
                  kind?: 'buy' | 'sell';
                  inputMint?: string;
                  outputMint?: string;
                  inAmount?: string;
                  outAmount?: string;
                }
              | undefined;
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
              groupId: groupIdFromIntent,
            });
            // Emit trade journal entry (approximate) for P&L
            try {
              const qty = Number(
                meta?.kind === 'sell' ? meta?.inAmount || '0' : meta?.outAmount || '0',
              );
              const inAmt = Number(meta?.inAmount || '0');
              const outAmt = Number(meta?.outAmount || '0');
              const priceLamports = !inAmt || !outAmt ? 0 : inAmt / outAmt;
              const priorityFeeLamports = Math.round(
                ((priorityFeeMicrolamports || 0) / 1e6) * (meta?.cuLimit || 200_000),
              );
              journalTrade({
                ts: Date.now(),
                side: meta?.kind === 'sell' ? 'sell' : 'buy',
                mint:
                  meta?.kind === 'sell'
                    ? meta?.inputMint || 'unknown'
                    : meta?.outputMint || 'unknown',
                qty,
                priceLamports,
                feeLamports: 0,
                priorityFeeLamports,
                groupId: groupIdFromIntent,
                wallet: walletPubkey,
                txid: signature,
                mode: 'RPC',
              });
              try {
                const { recordTrade } = await import('@/lib/db/sqlite');
                recordTrade({
                  ts: Date.now(),
                  side: meta?.kind === 'sell' ? 'sell' : 'buy',
                  mint:
                    meta?.kind === 'sell'
                      ? meta?.inputMint || 'unknown'
                      : meta?.outputMint || 'unknown',
                  qty,
                  priceLamports,
                  feeLamports: 0,
                  slot: confirmation.context.slot,
                  signature,
                  bundleId: null,
                  wallet: walletPubkey,
                  groupId: groupIdFromIntent,
                  mode: 'RPC',
                });
              } catch {}
            } catch {}
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
      }),
    ),
  );

  logJsonLine(journal, {
    ev: 'rpc_fanout_complete',
    runId,
    totalWallets: wallets.length,
    outcomes: {
      simulated: outcomes.filter((o) => o.status === 'SIMULATED').length,
      confirmed: outcomes.filter((o) => o.status === 'CONFIRMED').length,
      error: outcomes.filter((o) => o.status === 'ERROR').length,
      timeout: outcomes.filter((o) => o.status === 'TIMEOUT').length,
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
