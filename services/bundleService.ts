// @ts-ignore
import { Connection, Transaction, Signer, PublicKey, VersionedTransaction, TransactionConfirmationStrategy, TransactionMessage } from '@solana/web3.js';
// @ts-ignore
import { BundleClient } from 'jito-ts/dist/sdk/bundle/bundle-client';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '../constants';

type PreviewResult = {
  success: boolean;
  computeUnits: number;
  logs?: string[];
  error?: string;
};

type ExecutionResult = {
  usedJito: boolean;
  slotTargeted: number;
  signatures: string[];
  results: ('success' | 'failed')[];
  explorerUrls: string[];
  metrics: { estimatedCost: number; successRate: number; executionTime: number };
};

export async function buildBundle(txs: Transaction[], options: { priorityMap?: Map<string, number>; randomizeOrder?: boolean } = {}): Promise<Transaction[]> {
  if (txs.length > 20) {
    txs = txs.slice(0, 20);
  }
  if (options.priorityMap) {
    txs.sort((a, b) => (options.priorityMap?.get(a.feePayer?.toBase58() || '') ?? 0) - (options.priorityMap?.get(b.feePayer?.toBase58() || '') ?? 0));
  }
  if (options.randomizeOrder) {
    txs = txs.sort(() => Math.random() - 0.5);
  }
  return txs;
}

export async function previewBundle(txs: Transaction[], connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')): Promise<PreviewResult[]> {
  return Promise.all(txs.map(async (tx) => {
    try {
      const result = await connection.simulateTransaction(tx);
      return {
        success: !result.value.err,
        computeUnits: result.value.unitsConsumed || 0,
        logs: result.value.logs ?? undefined,
      };
    } catch (error: unknown) {
      return { success: false, computeUnits: 0, error: error instanceof Error ? error.message : String(error) };
    }
  }));
}

export async function executeBundle(
  txs: Transaction[],
  options: { signers?: Signer[]; feePayer?: PublicKey; offset?: number; retries?: number; logger?: (msg: string) => void; connection?: Connection; bundleClient?: BundleClient } = {}
): Promise<ExecutionResult> {
  const conn = options.connection || new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  const client = options.bundleClient || new BundleClient(NEXT_PUBLIC_JITO_ENDPOINT, conn);
  const { signers = [], feePayer, offset = 2, retries = 3, logger = console.log } = options;

  // Sign unsigned txs
  txs.forEach((tx, i) => {
    if (tx.signatures.length === 0) {
      if (feePayer) tx.feePayer = feePayer;
      tx.sign(signers[i] || []);
    }
  });

  // Validate all signed
  if (txs.some(tx => tx.signatures.length === 0)) {
    throw new Error('All transactions must be signed');
  }

  const txSignatures = txs.map(tx => tx.signatures[0].signature.toBase58());

  const startTime = Date.now();
  const currentSlot = await conn.getSlot();
  const targetSlot = currentSlot + offset;
  let usedJito = true;
  let signatures: string[] = txSignatures;
  let results: ('success' | 'failed')[] = [];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const bundleId = await client.sendBundle(txs);
      logger(`Bundle sent to slot ${targetSlot} on attempt ${attempt} with ID ${bundleId}`);
      results = await Promise.all(txSignatures.map(async (sig) => {
        try {
          await conn.confirmTransaction({ signature: sig, lastValidBlockHeight: targetSlot } as TransactionConfirmationStrategy, 'confirmed');
          return 'success';
        } catch {
          return 'failed';
        }
      }));
      if (results.every(r => r === 'success')) {
        break;
      }
    } catch (error: unknown) {
      logger(`Jito failed attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`);
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
              await conn.confirmTransaction({ signature: sig, lastValidBlockHeight: targetSlot } as TransactionConfirmationStrategy, 'confirmed');
              results.push('success');
              break;
            } catch (fbError: unknown) {
              logger(`Fallback failed for tx ${i} attempt ${fbAttempt}: ${fbError instanceof Error ? fbError.message : String(fbError)}`);
              if (fbAttempt === 3) {
                signatures.push('');
                results.push('failed');
              }
              await new Promise(resolve => setTimeout(resolve, 5000 * fbAttempt)); // Backoff
            }
          }
        }
      }
    }
  }

  const executionTime = Date.now() - startTime;
  const successRate = results.filter(r => r === 'success').length / results.length;
  const estimatedCost = txs.reduce((sum, tx) => sum + (tx.feePayer ? 5000 : 0), 0) / 1e9;
  const explorerUrls = signatures.map(sig => sig ? `https://solscan.io/tx/${sig}` : '');

  return { usedJito, slotTargeted: targetSlot, signatures, results, explorerUrls, metrics: { estimatedCost, successRate, executionTime } };
} 