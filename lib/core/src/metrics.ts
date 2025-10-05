type Labels = Record<string, string>;
const counters = new Map<string, number>();

export function incCounter(n, a, m, e: string, _, l, a, bels: Labels = {}): void {
  counters.set(name, (counters.get(name) || 0) + 1);
}

export function observeLatency(_, n, a, me: string, _, m, s: number, _, l, a, bels: Labels = {}): void {
  // no-op lightweight placeholder to satisfy imports
}

export function renderMetrics(): string {
  return Array.from(counters.entries()).map(([k, v]) => `${k} ${v}`).join('\n');
}
