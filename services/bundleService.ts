import { Connection, Transaction, Signer, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as Sentry from '@sentry/nextjs';
import axios from 'axios';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT, JITO_TIP_ACCOUNTS, NEXT_PUBLIC_BIRDEYE_API_KEY } from '../constants';
import { logBundleExecution } from './executionLogService';
import bs58 from 'bs58';

// Jito types
interface JitoResponse {
  jsonrpc: string;
  id: number;
  result?: string;
  error?: {
    code: number;
    message: string;
  };
}

interface JitoBundleStatus {
  bundle_id: string;
  status: 'pending' | 'landed' | 'failed' | 'invalid';
  landed_slot?: number;
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

// Select random Jito tip account
function getRandomTipAccount(): PublicKey {
  const randomIndex = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length);
  return new PublicKey(JITO_TIP_ACCOUNTS[randomIndex]);
}

async function validateToken(tokenAddress: string): Promise<boolean> {
  if (!NEXT_PUBLIC_BIRDEYE_API_KEY) {
    console.warn('Birdeye API key not configured');
    return true; // Allow transaction if API key not set
  }

  try {
    const response = await axios.get(`https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`, {
      headers: { 
        'X-API-KEY': NEXT_PUBLIC_BIRDEYE_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    
    const data = response.data?.data;
    if (!data) return false;
    
    // Check if token has sufficient liquidity and isn't blacklisted
    const hasLiquidity = data.liquidity && data.liquidity > 1000;
    const isValid = data.v24hUSD && data.v24hUSD > 100; // Has some trading volume
    
    return hasLiquidity && isValid;
  } catch (error) {
    console.error('Token validation failed:', error);
    return true; // Allow transaction on error
  }
}

async function getBundleFees(txs: Transaction[], connection: Connection): Promise<number[]> {
  return Promise.all(txs.map(async tx => {
    try {
      const fee = await connection.getFeeForMessage(tx.compileMessage());
      return fee.value || 5000;
    } catch {
      return 5000; // Default fee
    }
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
      if (groups[role]) {
        groups[role].push(tx);
      }
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
      
      const simulation = await connection.simulateTransaction(tx);
      
      return {
        success: simulation.value.err === null,
        logs: simulation.value.logs || [],
        computeUnits: simulation.value.unitsConsumed || 0,
        error: simulation.value.err ? JSON.stringify(simulation.value.err) : undefined,
      };
    } catch (error: unknown) {
      return { 
        success: false, 
        logs: [`Transaction ${index} simulation failed: ${(error as Error).message}`], 
        computeUnits: 0, 
        error: (error as Error).message 
      };
    }
  }));
}

async function createTipTransaction(
  payer: PublicKey,
  blockhash: string,
  tipAmount = 10000 // 0.00001 SOL default
): Promise<Transaction> {
  const tipTx = new Transaction();
  tipTx.recentBlockhash = blockhash;
  tipTx.feePayer = payer;
  
  tipTx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: getRandomTipAccount(),
      lamports: tipAmount,
    })
  );
  
  return tipTx;
}

async function submitBundleToJito(
  bundle: string[], // Base64 encoded transactions
  endpoint: string
): Promise<JitoResponse> {
  try {
    const response = await axios.post(
      `${endpoint}/api/v1/bundles`,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [bundle]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Jito submission error:', error.response?.data || error.message);
    throw error;
  }
}

async function getBundleStatus(
  bundleId: string,
  endpoint: string
): Promise<JitoBundleStatus | null> {
  try {
    const response = await axios.post(
      `${endpoint}/api/v1/bundles`,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBundleStatus',
        params: [bundleId]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      }
    );
    
    return response.data.result;
  } catch {
    return null;
  }
}

async function executeBundle(
  txs: Transaction[],
  walletRoles: { publicKey: string; role: string }[],
  signers: Signer[],
  options: { 
    feePayer?: PublicKey;
    tipAmount?: number;
    retries?: number;
    logger?: (msg: string) => void;
    connection?: Connection;
  } = {}
): Promise<ExecutionResult> {
  const conn = options.connection || new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  const retries = options.retries || 3;
  const tipAmount = options.tipAmount || 10000; // 0.00001 SOL default
  const logger = options.logger || console.log;
  
  // Validate bundle size
  if (txs.length === 0) {
    throw new Error('No transactions to bundle');
  }
  
  if (txs.length > 20) {
    throw new Error('Bundle size exceeds maximum of 20 transactions');
  }
  
  const startTime = Date.now();
  let usedJito = true;
  let signatures: string[] = [];
  let results: ('success' | 'failed')[] = [];
  let slotTargeted = 0;
  let bundleId: string | undefined;
  
  try {
    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
    const currentSlot = await conn.getSlot('confirmed');
    slotTargeted = currentSlot + 2; // Target 2 slots ahead
    
    // Sort transactions by role priority
    const sortedTxs = await buildBundle(txs, walletRoles);
    
    // Create tip transaction
    const tipTx = await createTipTransaction(
      options.feePayer || sortedTxs[0].feePayer!,
      blockhash,
      tipAmount
    );
    
    // Update all transactions with latest blockhash
    const allTxs = [tipTx, ...sortedTxs];
    allTxs.forEach(tx => {
      tx.recentBlockhash = blockhash;
    });
    
    // Sign all transactions
    allTxs.forEach((tx, i) => {
      if (signers[i]) {
        tx.sign(signers[i]);
      }
    });
    
    // Get signatures before submission
    signatures = allTxs.map(tx => bs58.encode(tx.signature || new Uint8Array()));
    
    // Try Jito submission
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger(`Attempt ${attempt}: Submitting bundle to Jito for slot ${slotTargeted}`);
        
        // Serialize transactions
        const serializedTxs = allTxs.map(tx => tx.serialize().toString('base64'));
        
        // Submit to Jito
        const jitoEndpoint = NEXT_PUBLIC_JITO_ENDPOINT;
        const response = await submitBundleToJito(serializedTxs, jitoEndpoint);
        
        if (response.error) {
          throw new Error(`Jito error: ${response.error.message}`);
        }
        
        bundleId = response.result;
        if (!bundleId) {
          throw new Error('No bundle ID returned from Jito');
        }
        logger(`Bundle submitted with ID: ${bundleId}`);
        
        // Wait for bundle to land (with timeout)
        const timeout = 30000; // 30 seconds
        const startWait = Date.now();
        let landed = false;
        
        while (Date.now() - startWait < timeout) {
          const status = await getBundleStatus(bundleId, jitoEndpoint);
          
          if (status?.status === 'landed') {
            landed = true;
            slotTargeted = status.landed_slot || slotTargeted;
            logger(`Bundle landed in slot ${slotTargeted}`);
            break;
          } else if (status?.status === 'failed' || status?.status === 'invalid') {
            throw new Error(`Bundle ${status.status}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (landed) {
          // Check transaction confirmations
          const confirmPromises = signatures.map(async (sig) => {
            try {
              const status = await conn.getSignatureStatus(sig);
              return status.value?.confirmationStatus === 'confirmed' || 
                     status.value?.confirmationStatus === 'finalized' ? 'success' : 'failed';
            } catch {
              return 'failed';
            }
          });
          
          results = await Promise.all(confirmPromises);
          
          const successCount = results.filter(r => r === 'success').length;
          if (successCount >= sortedTxs.length * 0.8) {
            logger(`Bundle executed successfully: ${successCount}/${results.length} confirmed`);
            break;
          }
        }
        
        if (attempt < retries) {
          logger(`Bundle execution incomplete, retrying in ${2 * attempt} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
        
      } catch (error: unknown) {
        Sentry.captureException(error);
        logger(`Jito attempt ${attempt} failed: ${(error as Error).message}`);
        
        if (attempt === retries) {
          // Fallback to standard RPC submission
          logger('Falling back to standard RPC submission');
          usedJito = false;
          signatures = [];
          results = [];
          
          // Submit transactions individually
          for (let i = 0; i < sortedTxs.length; i++) {
            for (let fbAttempt = 1; fbAttempt <= 3; fbAttempt++) {
              try {
                const sig = await conn.sendTransaction(sortedTxs[i], [signers[i]], {
                  skipPreflight: false,
                  maxRetries: 2,
                  preflightCommitment: 'confirmed'
                });
                
                signatures.push(sig);
                
                // Wait for confirmation
                const confirmation = await conn.confirmTransaction({
                  signature: sig,
                  blockhash,
                  lastValidBlockHeight
                }, 'confirmed');
                
                results.push(confirmation.value.err ? 'failed' : 'success');
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
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
  
  const executionTime = Date.now() - startTime;
  const successCount = results.filter(r => r === 'success').length;
  const successRate = results.length > 0 ? successCount / results.length : 0;
  const estimatedCost = ((txs.length + 1) * 5000 + tipAmount) / LAMPORTS_PER_SOL;
  const explorerUrls = signatures.map(sig => 
    sig ? `https://solscan.io/tx/${sig}` : ''
  );
  
  // Log to database
  await logBundleExecution({
    bundleId,
    slot: slotTargeted,
    signatures: signatures.filter(sig => sig),
    status: successRate > 0.8 ? 'success' : successRate > 0 ? 'partial' : 'failed',
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