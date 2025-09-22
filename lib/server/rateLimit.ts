const buckets = new Map<string, { tokens: number; ts: number }>();

export function rateLimit(key: string, cap = 30, refillPerSec = 10): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: cap, ts: now };
  const elapsed = (now - b.ts) / 1000;
  b.tokens = Math.min(cap, b.tokens + elapsed * refillPerSec);
  b.ts = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}


