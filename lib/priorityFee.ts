import { ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'veryHigh';

export function getComputeUnitPriceLamports(priority: PriorityLevel): number {
  switch (priority) {
    case 'veryHigh':
      return 1_000_000;
    case 'high':
      return 500_000;
    case 'medium':
      return 100_000;
    default:
      return 10_000;
  }
}

export function getDefaultComputeUnitLimit(): number {
  // Conservative default; tailor from simulation results if available
  return 200_000;
}

export function createComputeBudgetInstructions(
  priority: PriorityLevel = 'medium',
  unitLimit: number = getDefaultComputeUnitLimit(),
): TransactionInstruction[] {
  const setLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit });
  const microLamports = getComputeUnitPriceLamports(priority);
  const setPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports });
  return [setLimit, setPrice];
}

export function suggestPriorityFromRecentMicroLamports(avgMicroLamports: number): PriorityLevel {
  if (avgMicroLamports >= 800_000) return 'veryHigh';
  if (avgMicroLamports >= 300_000) return 'high';
  if (avgMicroLamports >= 60_000) return 'medium';
  return 'low';
}

