import 'server-only';

type Bucket = { tokens: number; ts: number };
type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };
type RouteConfig = { limit: number; windowMs: number };

const buckets = new Map<string, Bucket>();

const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  submit: { limit: 30, windowMs: 30_000 },
  walletOps: { limit: 20, windowMs: 60_000 },
  volume: { limit: 10, windowMs: 60_000 },
  default: { limit: 30, windowMs: 30_000 },
};

export function getRateConfig(route: string): RouteConfig {
  return ROUTE_CONFIGS[route] || ROUTE_CONFIGS.default;
}

export function rateLimit(key: string, limit = 30, windowMs = 30_000): RateLimitResult {
  const now = Date.now();
  const refillPerSec = limit / (windowMs / 1000);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: limit, ts: now };
    buckets.set(key, bucket);
  }

  const elapsed = (now - bucket.ts) / 1000;
  bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillPerSec);
  bucket.ts = now;

  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }

  const remaining = Math.floor(bucket.tokens);
  const resetAt = now + ((limit - bucket.tokens) / refillPerSec) * 1000;

  buckets.set(key, bucket);

  return { allowed, remaining, resetAt };
}

export async function rateLimitWithUpstash(
  key: string,
  limit = 30,
  windowMs = 30_000,
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    return rateLimit(key, limit, windowMs);
  }

  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    const windowKey = `rl:${key}`;

    const commands = [
      ['ZREMRANGEBYSCORE', windowKey, '0', windowStart.toString()],
      ['ZCARD', windowKey],
      ['ZADD', windowKey, now.toString(), `${now}-${Math.random()}`],
      ['EXPIRE', windowKey, Math.ceil(windowMs / 1000)],
    ];

    const res = await fetch(`${upstashUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!res.ok) {
      return rateLimit(key, limit, windowMs);
    }

    const results = (await res.json()) as Array<{ result: number }>;
    const count = results[1]?.result || 0;
    const allowed = count < limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = now + windowMs;

    return { allowed, remaining, resetAt };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}
