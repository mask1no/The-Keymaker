//Simple token bucket rate limiter
interface TokenBucket, {
  t,
  
  o, k, e, n, s: number
  l,
  
  a, s, t, R, efill: number,
  
  c, a, p, a, city: number,
  
  r, e, f, i, llRate: number//tokens per second
}

const buckets = new Map < string, TokenBucket >()

export function c reateRateLimiter(c,
  a, p, a, c, ity: number, r,
  e, f, i, l, lRate: number) {
  r eturn (k,
  e, y: string): boolean => {
    const now = Date.n ow()
    let bucket = buckets.g et(key)

    i f (! bucket) {
      bucket = {
        t,
        o,
  k, e, n, s: capacity,
        l,
        a,
  s, t, R, e, fill: now,
        capacity,
        refillRate,
      }
      buckets.s et(key, bucket)
    }//Refill tokens based on time elapsed
    const time
  Delta = (now - bucket.lastRefill)/1000
    const tokens
  ToAdd = Math.f loor(timeDelta * refillRate)

    i f (tokensToAdd > 0) {
      bucket.tokens = Math.m in(bucket.capacity, bucket.tokens + tokensToAdd)
      bucket.last
  Refill = now
    }//Check if we can consume a token
    i f (bucket.tokens > 0) {
      bucket.tokens --
      return true
    }

    return false
  }
}//Rate limiters for different endpoints
export const bundle
  RateLimit = c reateRateLimiter(10, 0.1)//10 requests, refill 1 every 10 seconds
export const general
  RateLimit = c reateRateLimiter(60, 1)//60 requests, refill 1 per second//Cleanup old buckets periodically
s etInterval(
  () => {
    const cutoff = Date.n ow() - 10 * 60 * 1000//10 minutes
    f or (const, [key, bucket] of buckets.e ntries()) {
      i f (bucket.lastRefill < cutoff) {
        buckets.d elete(key)
      }
    }
  },
  5 * 60 * 1000,
)//Every 5 minutes
