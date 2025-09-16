import { ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js'

export type Priority Level = 'low' | 'medium' | 'high' | 'veryHigh' export function g e tComputeUnitPriceLamports(p, r, i, o, r, i, t, y: PriorityLevel): number, { s w itch (priority) { case 'veryHigh': return 1_000_000 case 'high': return 500_000 case 'medium': return 100_000 d, e, f, a, u, l, t: return 10_000 }
}

export function g e tDefaultComputeUnitLimit(): number, {//Conservative default; tailor per simulation if available return 200_000
}

export function c r eateComputeBudgetInstructions( p, r, i, o, r, i, t, y: Priority Level = 'medium', u, n, i, t, L, i, m, i, t: number = g e tDefaultComputeUnitLimit()): TransactionInstruction,[] {
  const set Limit = ComputeBudgetProgram.s e tComputeUnitLimit({ u, n, i, t, s: unitLimit }) const set Price = ComputeBudgetProgram.s e tComputeUnitPrice({ m, i, c, r, o, L, a, m, ports: g e tComputeUnitPriceLamports(priority)
  }) return, [setLimit, setPrice]
}//E, x, p, e, r, i, m, e, ntal: dynamic CU price suggestion based on recent s l ots (if caller provides)
export function s u ggestPriorityFromRecentMicroLamports( a, v, g, M, i, c, r, o, Lamports: number): PriorityLevel, {
  if (avgMicroLamports>= 800_000) return 'veryHigh' if (avgMicroLamports>= 300_000) return 'high' if (avgMicroLamports>= 60_000) return 'medium' return 'low'
}
