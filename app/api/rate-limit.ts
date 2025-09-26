import { isRedisConfigured } from '@/lib/server/redis';
// Tiny in-memory rate limiter (per key) for dev/demo purposes
const buckets = new Map<string, { count: number; resetAt: number }>();
function getEnvInt(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  if (!isRedisConfigured()) {
    const now = Date.now();
    const entry = buckets.get(key);
    if (!entry || entry.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1 };
    }
    if (entry.count >= limit) {
      return { ok: false, remaining: 0, resetAt: entry.resetAt };
    }
    entry.count += 1;
    return { ok: true, remaining: limit - entry.count };
  }
  // Redis-based fixed window rate limiter (disabled in this build)
  // Best-effort pattern for serverless environments:
  // (async () => {
  //   try {
  //     const ttl = await redisPTTL(key);
  //     const count = await redisIncr(key);
  //     if (ttl < 0) await redisPExpire(key, windowMs);
  //     if (count > limit) await redisPExpire(key, Math.max(ttl, 1000));
  //   } catch { /* ignore */ }
  // })();
  return { ok: true, remaining: Math.max(limit - 1, 0) };
}
export function getRateConfig(kind: 'tipfloor' | 'submit' | 'status') {
  switch (kind) {
    case 'tipfloor':
      return {
        limit: getEnvInt('RATE_LIMIT_TIPFLOOR', 60),
        windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
      };
    case 'submit':
      return {
        limit: getEnvInt('RATE_LIMIT_SUBMIT', 20),
        windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
      };
    case 'status':
      return {
        limit: getEnvInt('RATE_LIMIT_STATUS', 60),
        windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
      };
  }
}
