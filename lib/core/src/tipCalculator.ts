/**
 * Jito Tip Calculator
 * Smart tip selection based on current market conditions
 */

export interface TipFloorData {
  p25: number;
  p50: number;
  p75: number;
  p95?: number;
}

const DEFAULT_MIN_TIP = 10_000; // 0.00001 SOL
const DEFAULT_MAX_TIP = 1_000_000; // 0.001 SOL

/**
 * Select optimal tip amount based on floor data
 * Strategy: Use 110% of median (p50) clamped to min/max
 */
export function selectTipLamports(
  floor: TipFloorData,
  min: number = DEFAULT_MIN_TIP,
  max: number = DEFAULT_MAX_TIP
): number {
  // Use p50 (median) as base
  const base = floor.p50 || 50_000;
  
  // Add 10% buffer to ensure competitive placement
  const calculated = Math.ceil(base * 1.1);
  
  // Clamp to min/max bounds
  return Math.max(min, Math.min(calculated, max));
}

/**
 * Get tip recommendation tier
 */
export function getTipTier(tipLamports: number): 'low' | 'medium' | 'high' | 'ultra' {
  if (tipLamports < 25_000) return 'low';
  if (tipLamports < 100_000) return 'medium';
  if (tipLamports < 500_000) return 'high';
  return 'ultra';
}

/**
 * Estimate bundle cost including tips
 */
export function estimateBundleCost(params: {
  tipLamports: number;
  numTransactions: number;
  avgComputeUnits?: number;
}): { tipCost: number; computeCost: number; total: number } {
  const { tipLamports, numTransactions, avgComputeUnits = 200_000 } = params;
  
  const tipCost = tipLamports;
  // Rough estimate: 5000 lamports per 200k CU
  const computeCost = Math.ceil((avgComputeUnits / 200_000) * 5_000) * numTransactions;
  
  return {
    tipCost,
    computeCost,
    total: tipCost + computeCost,
  };
}
