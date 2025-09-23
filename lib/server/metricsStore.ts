// Thin wrapper around core metrics to satisfy server-side usage and naming
import { incCounter as coreInc, observeLatency as coreObserve, renderMetrics as coreRender } from '@/lib/core/src/metrics';

export function incCounter(name: string, labels: Record<string, string> = {}): void {
  coreInc(name, labels);
}

export function observeLatency(
  name: string,
  ms: number,
  labels: Record<string, string> = {},
): void {
  coreObserve(name, ms, labels);
}

export function renderMetrics(): string {
  return coreRender();
}


