// @ts-nocheck
export type Priority = 'low' | 'med' | 'high' | 'vhigh'
export interface Budget { cuLimit: number; microLamports: number }
export function computeBudget(p: Priority): Budget {
  const cuLimit = 200_000
  const microLamports = p==='vhigh'?800_000:p==='high'?300_000:p==='med'?100_000:10_000
  return { cuLimit, microLamports }
}

