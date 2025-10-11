import { isRetryableError, withRetry } from '@/utils/withRetry';
import { createClient } from 'redis';

let client;
if (process.env.REDIS_URL) {
  client = createClient({ url: process.env.REDIS_URL });
  // Normal connect logic
} else {
  // In-memory fallback
  const memoryStore = new Map();
  client = {
    get: async (key) => memoryStore.get(key),
    set: async (key, value, options) => memoryStore.set(key, value),
    // Add del, etc., as needed
  };
  console.log('Redis not configured—using in-memory fallback');
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
async function upstash<T = any>(command: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL as string;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN as string;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const json = (await res.json()) as { result: T };
  return (json as any).result as T;
}
export async function redisIncr(key: string): Promise<number> {
  return withRetry(() => upstash<number>(['INCR', key]), {
    shouldRetry: isRetryableError,
    maxRetries: 2,
    delayMs: 200,
    exponentialBackoff: true,
  });
}
export async function redisPExpire(key: string, windowMs: number): Promise<number> {
  return withRetry(() => upstash<number>(['PEXPIRE', key, windowMs]), {
    shouldRetry: isRetryableError,
    maxRetries: 2,
    delayMs: 200,
    exponentialBackoff: true,
  });
}
export async function redisPTTL(key: string): Promise<number> {
  return withRetry(() => upstash<number>(['PTTL', key]), {
    shouldRetry: isRetryableError,
    maxRetries: 2,
    delayMs: 200,
    exponentialBackoff: true,
  });
}
