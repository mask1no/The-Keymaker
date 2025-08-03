import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface TransactionFees {
  gas: number; // in SOL
  jito: number; // in SOL
  total: number; // in SOL
}

/**
 * Calculate transaction fees for a bundle
 * @param txCount Number of transactions in the bundle
 * @param jitoTipLamports Jito tip amount in lamports
 * @returns Fees breakdown in SOL
 */
export function calculateBundleFees(
  txCount: number,
  jitoTipLamports: number = 0
): TransactionFees {
  // Base transaction fee is 5000 lamports per transaction
  const BASE_TX_FEE_LAMPORTS = 5000;
  
  // Calculate gas fees (includes one extra for the tip transaction if using Jito)
  const gasFeeLamports = txCount * BASE_TX_FEE_LAMPORTS;
  const gasFeeSOL = gasFeeLamports / LAMPORTS_PER_SOL;
  
  // Convert Jito tip to SOL
  const jitoTipSOL = jitoTipLamports / LAMPORTS_PER_SOL;
  
  return {
    gas: gasFeeSOL,
    jito: jitoTipSOL,
    total: gasFeeSOL + jitoTipSOL
  };
}

/**
 * Calculate per-wallet fees for PnL tracking
 * @param totalFees Total fees for the bundle
 * @param walletCount Number of wallets that participated
 * @returns Per-wallet fee allocation
 */
export function calculatePerWalletFees(
  totalFees: TransactionFees,
  walletCount: number
): TransactionFees {
  if (walletCount === 0) {
    return { gas: 0, jito: 0, total: 0 };
  }
  
  return {
    gas: totalFees.gas / walletCount,
    jito: totalFees.jito / walletCount,
    total: totalFees.total / walletCount
  };
}