type Labels = Record<string, string>;
const counters = new Map<string, number>();

export function incCounter(name: string, labels: Labels = {}): void {
  counters.set(name, (counters.get(name) || 0) + 1);
}

export function observeLatency(name: string, ms: number, labels: Labels = {}): void {
  // no-op lightweight placeholder to satisfy imports
}

export function renderMetrics(): string {
  return Array.from(counters.entries())
    .map(([k, v]) => `${k} ${v}`)
    .join('\n');
}
