import 'server-only';
import { Redis } from '@upstash/redis';

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt?: number };
const DEFAULT_WINDOW_MS = 10_000;
const DEFAULT_MAX = 50;
const LRU = new Map<string, { count: number; resetAt: number }>();

function local(key: string, limit = DEFAULT_MAX, windowMs = DEFAULT_WINDOW_MS): RateLimitResult {
  const now = Date.now();
  let entry = LRU.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }
  entry.count += 1;
  LRU.set(key, entry);
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
}

let redis: Redis | null = null;
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

export async function rateLimit(key: string, limit = DEFAULT_MAX, windowMs = DEFAULT_WINDOW_MS): Promise<RateLimitResult> {
  const r = await ensureRedis();
  if (!r) return local(key, limit, windowMs);
  const windowKey = `rl:${Math.floor(Date.now() / windowMs)}:${key}`;
  const count = Number(await r.incr(windowKey));
  if (count === 1) await r.expire(windowKey, Math.ceil(windowMs / 1000));
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

function getEnvInt(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
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

