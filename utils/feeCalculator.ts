export interface TransactionFees {
  gas: number;
  jito: number;
  total: number;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

export function calculateBundleFees(txCount: number, jitoTipLamports = 0): TransactionFees {
  const BASE_TX_FEE_LAMPORTS = 5000;
  const gasFeeLamports = Math.max(0, txCount) * BASE_TX_FEE_LAMPORTS;
  const gasFeeSOL = gasFeeLamports / LAMPORTS_PER_SOL;
  const jitoTipSOL = jitoTipLamports / LAMPORTS_PER_SOL;
  return {
    gas: gasFeeSOL,
    jito: jitoTipSOL,
    total: gasFeeSOL + jitoTipSOL,
  };
}

export function calculatePerWalletFees(
  totalFees: TransactionFees,
  walletCount: number,
): TransactionFees {
  if (walletCount <= 0) {
    return { gas: 0, jito: 0, total: 0 };
  }
  return {
    gas: totalFees.gas / walletCount,
    jito: totalFees.jito / walletCount,
    total: totalFees.total / walletCount,
  };
}
