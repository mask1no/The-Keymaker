import 'server-only';
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  SystemProgram,
} from '@solana/web3.js';
import { logger } from '@/lib/logger';

// Pump.fun program ID (mainnet)
const PUMPFUN_PROGRAM_ID = new PublicKey(
  process.env.PUMPFUN_PROGRAM_ID || '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
);

const GLOBAL_STATE = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf');
const FEE_RECIPIENT = new PublicKey('CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM');

interface CreateMintParams {
  master: Keypair;
  name: string;
  symbol: string;
  uri: string;
  connection: Connection;
}

interface BuyOnCurveParams {
  buyer: Keypair;
  mint: PublicKey;
  solLamports: number;
  slippageBps: number;
  connection: Connection;
  priorityFeeMicroLamports?: number;
}

/**
 * Build a transaction to create a new pump.fun token
 */
export async function buildCreateMintTx(params: CreateMintParams): Promise<VersionedTransaction> {
  const { master, name, symbol, uri, connection } = params;

  try {
    // Generate new mint keypair
    const mintKeypair = Keypair.generate();

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

    // Build create instruction (simplified - real implementation would use proper IDL)
    const createIx = SystemProgram.createAccount({
      fromPubkey: master.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      space: 82,
      programId: PUMPFUN_PROGRAM_ID,
    });

    // Add compute budget for creation
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 200_000,
    });

    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 50_000,
    });

    // Build transaction message
    const message = TransactionMessage.compile({
      payerKey: master.publicKey,
      instructions: [computeBudgetIx, priorityFeeIx, createIx],
      recentBlockhash: blockhash,
    });

    const tx = new VersionedTransaction(message);
    tx.sign([master, mintKeypair]);

    // Simulate before returning
    const simulation = await connection.simulateTransaction(tx);
    if (simulation.value.err) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    logger.info('Built pump.fun create TX', {
      mint: mintKeypair.publicKey.toBase58(),
      name,
      symbol,
    });

    return tx;
  } catch (error) {
    logger.error('Failed to build pump.fun create TX', { error });
    throw error;
  }
}

/**
 * Build a transaction to buy tokens on the pump.fun bonding curve
 */
export async function buildBuyOnCurveTx(params: BuyOnCurveParams): Promise<VersionedTransaction> {
  const { buyer, mint, solLamports, slippageBps, connection, priorityFeeMicroLamports = 50_000 } = params;

  try {
    const { blockhash } = await connection.getLatestBlockhash('finalized');

    // Calculate minimum tokens out with slippage
    const minTokensOut = calculateMinTokensOut(solLamports, slippageBps);

    // Build buy instruction (simplified - real implementation would use proper program interaction)
    const buyIx = SystemProgram.transfer({
      fromPubkey: buyer.publicKey,
      toPubkey: GLOBAL_STATE,
      lamports: solLamports,
    });

    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300_000,
    });

    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFeeMicroLamports,
    });

    const message = TransactionMessage.compile({
      payerKey: buyer.publicKey,
      instructions: [computeBudgetIx, priorityFeeIx, buyIx],
      recentBlockhash: blockhash,
    });

    const tx = new VersionedTransaction(message);
    tx.sign([buyer]);

    // Simulate
    const simulation = await connection.simulateTransaction(tx);
    if (simulation.value.err) {
      throw new Error(`Buy simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    logger.info('Built pump.fun buy TX', {
      buyer: buyer.publicKey.toBase58(),
      mint: mint.toBase58(),
      solLamports,
      slippageBps,
    });

    return tx;
  } catch (error) {
    logger.error('Failed to build pump.fun buy TX', { error });
    throw error;
  }
}

/**
 * Calculate minimum tokens out based on SOL amount and slippage
 */
function calculateMinTokensOut(solLamports: number, slippageBps: number): number {
  // Simplified bonding curve calculation
  // Real implementation would query current curve state
  const baseTokens = solLamports * 1000; // Placeholder conversion
  const slippageMultiplier = (10000 - slippageBps) / 10000;
  return Math.floor(baseTokens * slippageMultiplier);
}

/**
 * Get current price from bonding curve
 */
export async function getCurvePrice(mint: PublicKey, connection: Connection): Promise<number> {
  try {
    // Real implementation would parse on-chain curve state
    // Placeholder returns 0 if unable to determine
    return 0;
  } catch (error) {
    logger.error('Failed to get curve price', { error, mint: mint.toBase58() });
    return 0;
  }
}

