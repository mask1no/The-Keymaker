import 'server-only';
import { Redis } from '@upstash/redis';

type Result = { allowed: boolean; remaining: number };
const WINDOW_MS = 10_000, MAX = 50;
const LRU = new Map<string, { count: number; resetAt: number }>();

function local(key: string): Result {
  const now = Date.now();
  const e = LRU.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > e.resetAt) {
    e.count = 0;
    e.resetAt = now + WINDOW_MS;
  }
  e.count++;
  LRU.set(key, e);
  return { allowed: e.count <= MAX, remaining: Math.max(0, MAX - e.count) };
}

let redis: Redis | null = null;
async function ensure() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    redis = new Redis({ url, token });
  } catch {
    return null;
  }
  return redis;
}

export async function rateLimit(key: string): Promise<Result> {
  const r = await ensure();
  if (!r) return local(key);
  const win = `rl:${Math.floor(Date.now() / WINDOW_MS)}:${key}`;
  const c = Number(await r.incr(win));
  if (c === 1) await r.expire(win, Math.ceil(WINDOW_MS / 1000));
  return { allowed: c <= MAX, remaining: Math.max(0, MAX - c) };
}
