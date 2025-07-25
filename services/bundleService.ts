import { Connection, Transaction, Signer, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as Sentry from '@sentry/nextjs';
import axios from 'axios';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '../constants';
import { logBundleExecution } from './executionLogService';

// Jito types - simplified for production use
interface JitoBundle {
  transactions: Transaction[];
  recentBlockhash?: string;
}

interface JitoResponse {
  bundleId: string;
  status: string;
}

type PreviewResult = { 
  success: boolean;
  logs: string[];
  computeUnits: number;
  error?: string;
};

type ExecutionResult = {
  usedJito: boolean;
  slotTargeted: number;
  bundleId?: string;
  signatures: string[];
  results: ('success' | 'failed')[];
  explorerUrls: string[];
  metrics: { 
    estimatedCost: number;
    successRate: number;
    executionTime: number;
  };
};

const JITO_TIP_ACCOUNT = new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5');
const JITO_TIP_AMOUNT = 1000; // lamports

async function validateToken(tokenAddress: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://public-api.birdeye.so/token/${tokenAddress}`, {
      headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY },
      timeout: 5000
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

async function buildBundle(
  txs: Transaction[], 
  walletRoles: { publicKey: string; role: string }[],
  randomizeOrder = false
): Promise<Transaction[]> {
  // Sort by role priority: sniper > dev > normal
  let sortedTxs = [...txs].sort((a, b) => {
    const getRolePriority = (tx: Transaction) => {
      const wallet = walletRoles.find(w => w.publicKey === tx.feePayer?.toBase58());
      if (!wallet) return 3;
      return wallet.role === 'sniper' ? 0 : wallet.role === 'dev' ? 1 : 2;
    };
    return getRolePriority(a) - getRolePriority(b);
  });
  
  if (randomizeOrder) {
    // Randomize within role groups
    const groups: { [key: string]: Transaction[] } = { sniper: [], dev: [], normal: [] };
    sortedTxs.forEach(tx => {
      const wallet = walletRoles.find(w => w.publicKey === tx.feePayer?.toBase58());
      const role = wallet?.role || 'normal';
      groups[role].push(tx);
    });
    
    // Shuffle within groups
    Object.keys(groups).forEach(role => {
      groups[role].sort(() => Math.random() - 0.5);
    });
    
    sortedTxs = [...groups.sniper, ...groups.dev, ...groups.normal];
  }
  
  return sortedTxs;
}

async function previewBundle(
  txs: Transaction[], 
  connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
): Promise<PreviewResult[]> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  
  return Promise.all(txs.map(async (tx, index) => {
    try {
      // Update blockhash for simulation
      tx.recentBlockhash = blockhash;
      
      const simulation = await connection.simulateTransaction(tx, undefined, []);
      
      return {
        success: simulation.value.err === null,
        logs: simulation.value.logs || [],
        computeUnits: simulation.value.unitsConsumed || 0,
        error: simulation.value.err ? JSON.stringify(simulation.value.err) : undefined,
      };
    } catch (error: unknown) {
      return { 
        success: false, 
        logs: [`Transaction ${index} simulation failed`], 
        computeUnits: 0, 
        error: (error as Error).message 
      };
    }
  }));
}

async function createTipTransaction(
  payer: PublicKey,
  blockhash: string
): Promise<Transaction> {
  const tipTx = new Transaction();
  tipTx.recentBlockhash = blockhash;
  tipTx.feePayer = payer;
  
  tipTx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: JITO_TIP_ACCOUNT,
      lamports: JITO_TIP_AMOUNT,
    })
  );
  
  return tipTx;
}

async function submitBundleToJito(
  bundle: JitoBundle,
  endpoint: string
): Promise<JitoResponse> {
  const response = await axios.post(
    `${endpoint}/api/v1/bundles`,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [bundle.transactions.map(tx => tx.serialize().toString('base64'))]
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    }
  );
  
  return {
    bundleId: response.headers['x-bundle-id'] || response.data.result,
    status: 'submitted'
  };
}

async function executeBundle(
  txs: Transaction[],
  walletRoles: { publicKey: string; role: string }[],
  signers: Signer[],
  options: { 
    feePayer?: PublicKey;
    retries?: number;
    logger?: (msg: string) => void;
    connection?: Connection;
  } = {}
): Promise<ExecutionResult> {
  const conn = options.connection || new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  const retries = options.retries || 3;
  const logger = options.logger || (() => undefined);
  
  // Validate bundle size
  if (txs.length > 20) {
    throw new Error('Bundle size exceeds maximum of 20 transactions');
  }
  
  const startTime = Date.now();
  let usedJito = true;
  let signatures: string[] = [];
  let results: ('success' | 'failed')[] = [];
  let slotTargeted = 0;
  let bundleId: string | undefined;
  
  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  
  // Sort transactions by role priority
  const sortedTxs = await buildBundle(txs, walletRoles);
  
  // Create tip transaction
  const tipTx = await createTipTransaction(
    options.feePayer || sortedTxs[0].feePayer!,
    blockhash
  );
  
  // Update all transactions with latest blockhash
  sortedTxs.forEach(tx => {
    tx.recentBlockhash = blockhash;
  });
  
  // Try Jito first
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const currentSlot = await conn.getSlot('confirmed');
      slotTargeted = currentSlot + 2; // Target 2 slots ahead
      
      logger(`Attempt ${attempt}: Building Jito bundle for slot ${slotTargeted}`);
      
      // Sign all transactions
      if (signers[0]) {
        tipTx.sign(signers[0]);
      }
      sortedTxs.forEach((tx, i) => {
        if (signers[i]) {
          tx.sign(signers[i]);
        }
      });
      
      // Build bundle
      const bundle: JitoBundle = {
        transactions: [tipTx, ...sortedTxs],
        recentBlockhash: blockhash
      };
      
      // Submit to Jito
      const jitoEndpoint = NEXT_PUBLIC_JITO_ENDPOINT || 'https://mainnet.block-engine.jito.wtf';
      const response = await submitBundleToJito(bundle, jitoEndpoint);
      
      bundleId = response.bundleId;
      logger(`Bundle submitted with ID: ${bundleId}`);
      
      // Get signatures
      signatures = [tipTx.signature?.toString() || '', ...sortedTxs.map(tx => tx.signature?.toString() || '')];
      
      // Wait for confirmation
      const confirmPromises = signatures.filter(sig => sig).map(async (sig) => {
        try {
          await conn.confirmTransaction({
            signature: sig,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');
          return 'success';
        } catch {
          return 'failed';
        }
      });
      
      results = await Promise.all(confirmPromises);
      
      if (results.filter(r => r === 'success').length >= sortedTxs.length * 0.8) {
        logger(`Bundle executed successfully in slot ${slotTargeted}`);
        break;
      }
      
      logger(`Bundle execution incomplete, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      
    } catch (error: unknown) {
      Sentry.captureException(error);
      logger(`Jito attempt ${attempt} failed: ${(error as Error).message}`);
      
      if (attempt === retries) {
        // Fallback to standard submission
        logger('Falling back to standard transaction submission');
        usedJito = false;
        signatures = [];
        results = [];
        
        for (let i = 0; i < sortedTxs.length; i++) {
          for (let fbAttempt = 1; fbAttempt <= 3; fbAttempt++) {
            try {
              const sig = await conn.sendTransaction(sortedTxs[i], signers.slice(i, i + 1), {
                skipPreflight: false,
                maxRetries: 2
              });
              
              signatures.push(sig);
              
              await conn.confirmTransaction({
                signature: sig,
                blockhash,
                lastValidBlockHeight
              }, 'confirmed');
              
              results.push('success');
              break;
              
            } catch (fbError: unknown) {
              logger(`Fallback failed for tx ${i} attempt ${fbAttempt}: ${(fbError as Error).message}`);
              if (fbAttempt === 3) {
                signatures.push('');
                results.push('failed');
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * fbAttempt));
            }
          }
        }
      }
    }
  }
  
  const executionTime = Date.now() - startTime;
  const successCount = results.filter(r => r === 'success').length;
  const successRate = successCount / results.length;
  const estimatedCost = (txs.length * 5000 + JITO_TIP_AMOUNT) / LAMPORTS_PER_SOL;
  const explorerUrls = signatures.map(sig => 
    sig ? `https://solscan.io/tx/${sig}` : ''
  );
  
  // Log to database
  await logBundleExecution({
    bundleId,
    slot: slotTargeted,
    signatures: signatures.filter(sig => sig),
    status: successRate > 0.8 ? 'success' : 'partial',
    successCount,
    failureCount: results.length - successCount,
    usedJito,
    executionTime
  });
  
  return { 
    usedJito, 
    slotTargeted,
    bundleId,
    signatures, 
    results, 
    explorerUrls, 
    metrics: { 
      estimatedCost, 
      successRate, 
      executionTime 
    } 
  };
}

export { 
  validateToken, 
  getBundleFees, 
  buildBundle, 
  previewBundle, 
  executeBundle,
  type PreviewResult,
  type ExecutionResult
}; 