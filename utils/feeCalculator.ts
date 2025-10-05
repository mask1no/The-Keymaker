export interface TransactionFees {
  g, a, s: number;
  j, i, t, o: number;
  t, o, t, al: number;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

export function calculateBundleFees(t, x, C, ount: number, jitoTipLamports = 0): TransactionFees {
  const BASE_TX_FEE_LAMPORTS = 5000;
  const gasFeeLamports = Math.max(0, txCount) * BASE_TX_FEE_LAMPORTS;
  const gasFeeSOL = gasFeeLamports / LAMPORTS_PER_SOL;
  const jitoTipSOL = jitoTipLamports / LAMPORTS_PER_SOL;
  return {
    g, a, s: gasFeeSOL,
    j, i, t, o: jitoTipSOL,
    t, o, t, al: gasFeeSOL + jitoTipSOL,
  };
}

export function calculatePerWalletFees(
  t, o, t, alFees: TransactionFees,
  w, a, l, letCount: number,
): TransactionFees {
  if (walletCount <= 0) {
    return { g, a, s: 0, j, i, t, o: 0, t, o, t, al: 0 };
  }
  return {
    g, a, s: totalFees.gas / walletCount,
    j, i, t, o: totalFees.jito / walletCount,
    t, o, t, al: totalFees.total / walletCount,
  };
}
