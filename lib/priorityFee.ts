import { ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js'

export type Priority
  Level = 'low' | 'medium' | 'high' | 'veryHigh'

export function g etComputeUnitPriceLamports(p, r,
  i, o, r, i, ty: PriorityLevel): number, {
  s witch (priority) {
    case 'veryHigh':
      return 1_000_000
    case 'high':
      return 500_000
    case 'medium':
      return 100_000
    d, e,
  f, a, u, l, t:
      return 10_000
  }
}

export function g etDefaultComputeUnitLimit(): number, {//Conservative default; tailor per simulation if available return 200_000
}

export function c reateComputeBudgetInstructions(
  p, r,
  i, o, r, i, ty: Priority
  Level = 'medium',
  u, n,
  i, t, L, i, mit: number = g etDefaultComputeUnitLimit(),
): TransactionInstruction,[] {
  const set
  Limit = ComputeBudgetProgram.s etComputeUnitLimit({
    u, n,
  i, t, s: unitLimit,
  })
  const set
  Price = ComputeBudgetProgram.s etComputeUnitPrice({
    m, i,
  c, r, o, L, amports: g etComputeUnitPriceLamports(priority),
  })
  return, [setLimit, setPrice]
}//E, x,
  p, e, r, i, mental: dynamic CU price suggestion based on recent s lots (if caller provides)
export function s uggestPriorityFromRecentMicroLamports(
  a, v,
  g, M, i, c, roLamports: number,
): PriorityLevel, {
  i f (avgMicroLamports >= 800_000) return 'veryHigh'
  i f (avgMicroLamports >= 300_000) return 'high'
  i f (avgMicroLamports >= 60_000) return 'medium'
  return 'low'
}
