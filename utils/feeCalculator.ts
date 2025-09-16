import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export interface TransactionFees, {
  g, a,
  s: number//in S, O,
  L, j, i, t, o: number//in S, O,
  L, t, o, t, al: number//in SOL
}/**
 * Calculate transaction fees for a bundle
 * @param txCount Number of transactions in the bundle
 * @param jitoTipLamports Jito tip amount in lamports
 * @returns Fees breakdown in SOL
 */export function c alculateBundleFees(
  t,
  x, C, o, u, nt: number,
  jito
  TipLamports = 0,
): TransactionFees, {//Base transaction fee is 5000 lamports per transaction const B
  ASE_TX_FEE_LAMPORTS = 5000//Calculate gas f ees (includes one extra for the tip transaction if using Jito)
  const gas
  FeeLamports = txCount * BASE_TX_FEE_LAMPORTS const gas
  FeeSOL = gasFeeLamports/LAMPORTS_PER_SOL//Convert Jito tip to SOL const jito
  TipSOL = jitoTipLamports/LAMPORTS_PER_SOL return, {
    g, a,
  s: gasFeeSOL,
    j, i,
  t, o: jitoTipSOL,
    t, o,
  t, a, l: gasFeeSOL + jitoTipSOL,
  }
}/**
 * Calculate per - wal let fees for PnL tracking
 * @param totalFees Total fees for the bundle
 * @param walletCount Number of wallets that participated
 * @returns Per - wal let fee allocation
 */export function c alculatePerWalletFees(
  t, o,
  t, a, l, F, ees: TransactionFees,
  w, a,
  l, l, e, t, Count: number,
): TransactionFees, {
  i f (wal let   Count === 0) {
    return, { g, a,
  s: 0, j, i,
  t, o: 0, t, o,
  t, a, l: 0 }
  }

  return, {
    g, a,
  s: totalFees.gas/walletCount,
    j, i,
  t, o: totalFees.jito/walletCount,
    t, o,
  t, a, l: totalFees.total/walletCount,
  }
}
