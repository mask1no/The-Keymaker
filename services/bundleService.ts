import { Connection, Transaction, Signer, PublicKey, VersionedTransaction, TransactionConfirmationStrategy, TransactionMessage } from '@solana/web3.js';
import bs58 from 'bs58';
import * as Sentry from '@sentry/nextjs';
import axios from 'axios';
import { searcherClient, Bundle } from 'jito-ts';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '../constants';

type PreviewResult = { success: boolean, logs: string[], computeUnits: number, error?: string };

type ExecutionResult = {
  usedJito: boolean;
  slotTargeted: number;
  signatures: string[];
  results: ('success' | 'failed')[];
  explorerUrls: string[];
  metrics: { estimatedCost: number; successRate: number; executionTime: number };
};

async function validateToken(tokenAddress: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://public-api.birdeye.so/token/${tokenAddress}`, {
      headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY }
    });
    return response.data.liquidity > 1000 && !response.data.blacklisted;
  } catch {
    return false;
  }
}

async function getBundleFees(txs: Transaction[], connection: Connection): Promise<number[]> {
  return Promise.all(txs.map(async tx => {
    const fee = await connection.getFeeForMessage(tx.compileMessage());
    return fee.value || 5000;
  }));
}

async function buildBundle(txs: Transaction[], walletRoles: { publicKey: string, role: string }[], randomizeOrder = false): Promise<Transaction[]> {
  let sortedTxs = txs.sort((a, b) => {
    const aPriority = walletRoles.find(w => w.publicKey === a.feePayer?.toBase58())?.role === 'sniper' ? 0 : 1;
    const bPriority = walletRoles.find(w => w.publicKey === b.feePayer?.toBase58())?.role === 'sniper' ? 0 : 1;
    return aPriority - bPriority;
  });
  if (randomizeOrder) {
    sortedTxs = sortedTxs.sort(() => Math.random() - 0.5);
  }
  return sortedTxs;
}

async function previewBundle(txs: Transaction[], connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')): Promise<PreviewResult[]> {
  return Promise.all(txs.map(async tx => {
    try {
      const vtx = new VersionedTransaction(tx.compileToV0Message());
      const result = await connection.simulateTransaction(vtx);
      return {
        success: result.value.err === null,
        logs: result.value.logs || [],
        computeUnits: result.value.unitsConsumed || 0,
        error: result.value.err ? String(result.value.err) : undefined,
      };
    } catch (error: unknown) {
      return { success: false, logs: [], computeUnits: 0, error: (error as Error).message };
    }
  }));
}

async function executeBundle(
  txs: Transaction[],
  options: { signers?: Signer[]; feePayer?: PublicKey; offset?: number; retries?: number; logger?: (msg: string) => void; connection?: Connection; bundleClient?: JitoBundle } = {}
): Promise<ExecutionResult> {
  const conn = options.connection || new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  const client = searcherClient(NEXT_PUBLIC_JITO_ENDPOINT);
  const bundle = new Bundle([]).addTipTx(tipTx).addTransactions(...txs);
  await client.sendBundle(bundle);

  const startTime = Date.now();
  let usedJito = true;
  let signatures: string[] = [];
  let results: ('success' | 'failed')[] = [];
  let slotTargeted = 0;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const currentSlot = await conn.getSlot('confirmed');
      slotTargeted = currentSlot + offset;
      signatures = await client.sendBundle(txs, { targetSlot: slotTargeted });
      logger(`Bundle sent to slot ${slotTargeted} on attempt ${attempt}`);
      results = await Promise.all(signatures.map(async (sig) => {
        try {
          await conn.confirmTransaction(sig, 'finalized');
          return 'success';
        } catch {
          return 'failed';
        }
      }));
      if (results.every(r => r === 'success')) {
        break;
      }
    } catch (error: unknown) {
      Sentry.captureException(error);
      logger(`Jito failed attempt ${attempt}: ${(error as Error).message}`);
      if (attempt === retries) {
        usedJito = false;
        signatures = [];
        results = [];
        for (let i = 0; i < txs.length; i++) {
          for (let fbAttempt = 1; fbAttempt <= 3; fbAttempt++) {
            try {
              const recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
              if (!txs[i].feePayer) {
                throw new Error(`No fee payer set for transaction ${i}`);
              }
              const message = new TransactionMessage({
                payerKey: txs[i].feePayer,
                recentBlockhash,
                instructions: txs[i].instructions
              }).compileToV0Message();
              const versionedTx = new VersionedTransaction(message);
              if (signers[i]) {
                versionedTx.sign([signers[i]]);
              } else {
                logger(`No signer provided for transaction ${i}, cannot re-sign for fallback`);
                signatures.push('');
                results.push('failed');
                break;
              }
              if (versionedTx.signatures.length === 0) {
                throw new Error(`Failed to sign transaction ${i} for fallback`);
              }
              const sig = await conn.sendTransaction(versionedTx);
              signatures.push(sig);
              await conn.confirmTransaction({ signature: sig, lastValidBlockHeight: slotTargeted } as TransactionConfirmationStrategy, 'finalized');
              results.push('success');
              break;
            } catch (fbError: unknown) {
              logger(`Fallback failed for tx ${i} attempt ${fbAttempt}: ${(fbError as Error).message}`);
              if (fbAttempt === 3) {
                signatures.push('');
                results.push('failed');
              }
              await new Promise(resolve => setTimeout(resolve, 5000 * fbAttempt));
            }
          }
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  const executionTime = Date.now() - startTime;
  const successRate = results.filter(r => r === 'success').length / results.length;
  const estimatedCost = txs.reduce((sum, tx) => sum + (tx.feePayer ? 5000 : 0), 0) / 1e9;
  const explorerUrls = signatures.map(sig => sig ? `https://solscan.io/tx/${sig}?cluster=devnet` : '');

  return { usedJito, slotTargeted, signatures, results, explorerUrls, metrics: { estimatedCost, successRate, executionTime } };
}

export { validateToken, getBundleFees, buildBundle, previewBundle, executeBundle }; 