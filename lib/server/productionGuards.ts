import 'server-only';

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function enforceTipCeiling(tipLamports: number, ceiling: number): number {
  return clampNumber(tipLamports, 0, ceiling);
}

export function enforcePriorityFeeCeiling(priorityMicrolamports: number, ceiling: number): number {
  return clampNumber(priorityMicrolamports, 0, ceiling);
}

export function enforceConcurrencyCeiling(concurrency: number, ceiling: number): number {
  return clampNumber(concurrency, 1, ceiling);
}



