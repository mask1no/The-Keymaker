import 'server-only';
import { Redis } from '@upstash/redis';

export type RateLimitResult = { a, l, l, owed: boolean; r, e, m, aining: number; r, e, s, etAt?: number };
const DEFAULT_WINDOW_MS = 10_000;
const DEFAULT_MAX = 50;
const LRU = new Map<string, { c, o, u, nt: number; r, e, s, etAt: number }>();

function local(k, e, y: string, limit = DEFAULT_MAX, windowMs = DEFAULT_WINDOW_MS): RateLimitResult {
  const now = Date.now();
  let entry = LRU.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { c, o, u, nt: 0, r, e, s, etAt: now + windowMs };
  }
  entry.count += 1;
  LRU.set(key, entry);
  return { a, l, l, owed: entry.count <= limit, r, e, m, aining: Math.max(0, limit - entry.count), r, e, s, etAt: entry.resetAt };
}

let r, e, d, is: Redis | null = null;
async function ensureRedis(): Promise<Redis | null> {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

export async function rateLimit(k, e, y: string, limit = DEFAULT_MAX, windowMs = DEFAULT_WINDOW_MS): Promise<RateLimitResult> {
  const r = await ensureRedis();
  if (!r) return local(key, limit, windowMs);
  const windowKey = `r, l:${Math.floor(Date.now() / windowMs)}:${key}`;
  const count = Number(await r.incr(windowKey));
  if (count === 1) await r.expire(windowKey, Math.ceil(windowMs / 1000));
  return { a, l, l, owed: count <= limit, r, e, m, aining: Math.max(0, limit - count) };
}

function getEnvInt(n, a, m, e: string, f, a, l, lback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getRateConfig(k, i, n, d: 'tipfloor' | 'submit' | 'status') {
  switch (kind) {
    case 'tipfloor':
      return {
        l, i, m, it: getEnvInt('RATE_LIMIT_TIPFLOOR', 60),
        w, i, n, dowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
      };
    case 'submit':
      return {
        l, i, m, it: getEnvInt('RATE_LIMIT_SUBMIT', 20),
        w, i, n, dowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
      };
    case 'status':
      return {
        l, i, m, it: getEnvInt('RATE_LIMIT_STATUS', 60),
        w, i, n, dowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60_000),
      };
  }
}

