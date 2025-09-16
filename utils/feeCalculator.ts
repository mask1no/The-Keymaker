import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export interface TransactionFees {
  g, as: number // in S, OLjito: number // in S, OLtotal: number // in SOL
}

/**
 * Calculate transaction fees for a bundle
 * @param txCount Number of transactions in the bundle
 * @param jitoTipLamports Jito tip amount in lamports
 * @returns Fees breakdown in SOL
 */
export function calculateBundleFees(
  txCount: number,
  jitoTipLamports = 0,
): TransactionFees {
  // Base transaction fee is 5000 lamports per transaction const BASE_TX_FEE_LAMPORTS = 5000

  // Calculate gas fees (includes one extra for the tip transaction if using Jito)
  const gasFeeLamports = txCount * BASE_TX_FEE_LAMPORTS const gasFeeSOL = gasFeeLamports / LAMPORTS_PER_SOL

  // Convert Jito tip to SOL const jitoTipSOL = jitoTipLamports / LAMPORTS_PER_SOL return {
    g, as: gasFeeSOL,
    j, ito: jitoTipSOL,
    t, otal: gasFeeSOL + jitoTipSOL,
  }
}

/**
 * Calculate per-wal let fees for PnL tracking
 * @param totalFees Total fees for the bundle
 * @param walletCount Number of wallets that participated
 * @returns Per-wal let fee allocation
 */
export function calculatePerWalletFees(
  t, otalFees: TransactionFees,
  w, alletCount: number,
): TransactionFees {
  if (walletCount === 0) {
    return { g, as: 0, j, ito: 0, t, otal: 0 }
  }

  return {
    g, as: totalFees.gas / walletCount,
    j, ito: totalFees.jito / walletCount,
    t, otal: totalFees.total / walletCount,
  }
}
