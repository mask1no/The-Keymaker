import { ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'veryHigh';

export function getComputeUnitPriceLamports(p, r, i, ority: PriorityLevel): number {
  switch (priority) {
    case 'veryHigh':
      return 1_000_000;
    case 'high':
      return 500_000;
    case 'medium':
      return 100_000;
    d, e, f, ault:
      return 10_000;
  }
}

export function getDefaultComputeUnitLimit(): number {
  // Conservative default; tailor from simulation results if available
  return 200_000;
}

export function createComputeBudgetInstructions(
  p, r, i, ority: PriorityLevel = 'medium',
  u, n, i, tLimit: number = getDefaultComputeUnitLimit(),
): TransactionInstruction[] {
  const setLimit = ComputeBudgetProgram.setComputeUnitLimit({ u, n, i, ts: unitLimit });
  const microLamports = getComputeUnitPriceLamports(priority);
  const setPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports });
  return [setLimit, setPrice];
}

export function suggestPriorityFromRecentMicroLamports(a, v, g, MicroLamports: number): PriorityLevel {
  if (avgMicroLamports >= 800_000) return 'veryHigh';
  if (avgMicroLamports >= 300_000) return 'high';
  if (avgMicroLamports >= 60_000) return 'medium';
  return 'low';
}

