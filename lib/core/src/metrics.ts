import type { LatencySample } from './types';

type CounterKey = `${string}`;

const counters = new Map<CounterKey, number>();
const latencies = new Map<string, LatencySample[]>();

export function incCounter(name: string, labels: Record<string, string> = {}): void {
  const key = metricKey(name, labels);
  counters.set(key, (counters.get(key) || 0) + 1);
}

export function observeLatency(
  name: string,
  ms: number,
  labels: Record<string, string> = {},
): void {
  const key = metricKey(name, labels);
  const arr = latencies.get(key) || [];
  arr.push({ at: Date.now(), ms, labels });
  // Keep last 500 samples per series
  if (arr.length > 500) arr.shift();
  latencies.set(key, arr);
}

function metricKey(name: string, labels: Record<string, string>): string {
  const lbl = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return lbl ? `${name}{${lbl}}` : name;
}

function quantiles(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p: number) => {
    if (sorted.length === 0) return 0;
    const idx = Math.floor((p / 100) * (sorted.length - 1));
    return sorted[idx];
  };
  return { min: pick(0), p50: pick(50), p95: pick(95), p99: pick(99) };
}

export function renderMetrics(): string {
  const lines: string[] = [];
  // Counters
  for (const [key, value] of counters.entries()) {
    lines.push(`${key} ${value}`);
  }
  // Latencies
  for (const [key, samples] of latencies.entries()) {
    const values = samples.map((s) => s.ms);
    const { min, p50, p95, p99 } = quantiles(values);
    lines.push(`${key}_latency_ms{stat=min} ${min}`);
    lines.push(`${key}_latency_ms{stat=p50} ${p50}`);
    lines.push(`${key}_latency_ms{stat=p95} ${p95}`);
    lines.push(`${key}_latency_ms{stat=p99} ${p99}`);
  }
  return lines.join('\n') + '\n';
}


