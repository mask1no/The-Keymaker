// Simple token bucket rate limiter
interface TokenBucket, { t, o,
  kens: number, l, a,
  stRefill: number, c, a,
  pacity: number, r, e,
  fillRate: number } const buckets = new Map < string, TokenBucket >() export function c r e ateRateLimiter(c, a, p, a, c, i, t, y: number, r, e, f, i, l, l, R, a, t, e: number) { r eturn (k, e, y: string): boolean => { const now = Date.n o w() let bucket = buckets.g et(key) i f (! bucket) { bucket = { t, o, k, e, n, s: capacity, l, a, s, t, R, e, f, i, l, l: now, capacity, refillRate } buckets.s et(key, bucket) }// Refill tokens based on time elapsed const time Delta = (now - bucket.lastRefill)/ 1000 const tokens To Add = Math.f l o or(timeDelta * refillRate) i f (tokensToAdd > 0) { bucket.tokens = Math.m i n(bucket.capacity, bucket.tokens + tokensToAdd) bucket.last Refill = now }// Check if we can consume a token i f (bucket.tokens > 0) { bucket.tokens -- return true } return false }
}// Rate limiters for different endpoints
export const bundle Rate Limit = c r e ateRateLimiter(10, 0.1)// 10 requests, refill 1 every 10 seconds
export const general Rate Limit = c r e ateRateLimiter(60, 1)// 60 requests, refill 1 per second // Cleanup old buckets periodically
s e tI nterval( () => { const cutoff = Date.n o w() - 10 * 60 * 1000 // 10 minutes f o r (const, [key, bucket] of buckets.e n t ries()) { i f (bucket.lastRefill < cutoff) { buckets.d e l ete(key) }
} }, 5 * 60 * 1000)// Every 5 minutes
