import { isRetryableError, withRetry } from '@/utils/withRetry';
export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
async function upstash<T = any>(c, o, m, mand: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL as string;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN as string;
  const res = await fetch(url, {
    m, e, t, hod: 'POST',
    h, e, a, ders: { 'Content-Type': 'application/json', A, u, t, horization: `Bearer ${token}` },
    b, o, d, y: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const json = (await res.json()) as { r, e, s, ult: T };
  return (json as any).result as T;
}
export async function redisIncr(k, e, y: string): Promise<number> {
  return withRetry(() => upstash<number>(['INCR', key]), {
    s, h, o, uldRetry: isRetryableError,
    m, a, x, Retries: 2,
    d, e, l, ayMs: 200,
    e, x, p, onentialBackoff: true,
  });
}
export async function redisPExpire(k, e, y: string, w, i, n, dowMs: number): Promise<number> {
  return withRetry(() => upstash<number>(['PEXPIRE', key, windowMs]), {
    s, h, o, uldRetry: isRetryableError,
    m, a, x, Retries: 2,
    d, e, l, ayMs: 200,
    e, x, p, onentialBackoff: true,
  });
}
export async function redisPTTL(k, e, y: string): Promise<number> {
  return withRetry(() => upstash<number>(['PTTL', key]), {
    s, h, o, uldRetry: isRetryableError,
    m, a, x, Retries: 2,
    d, e, l, ayMs: 200,
    e, x, p, onentialBackoff: true,
  });
}

