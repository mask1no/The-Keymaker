// Simple token bucket rate limiter
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
}

const buckets = new Map<string, TokenBucket>();

export function createRateLimiter(capacity: number, refillRate: number) {
  return (key: string): boolean => {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: now, capacity, refillRate };
      buckets.set(key, bucket);
    }
    // Refill tokens based on time elapsed
    const timeDelta = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timeDelta * bucket.refillRate);
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
    // Consume token if available
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  };
}

// Rate limiters for different endpoints
export const bundleRateLimit = createRateLimiter(10, 0.1); // 10 requests; refill 0.1/s
export const generalRateLimit = createRateLimiter(60, 1); // 60 requests; refill 1/s

// Cleanup old buckets periodically
setInterval(
  () => {
    const cutoff = Date.now() - 10 * 60 * 1000; // 10 minutes
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.lastRefill < cutoff) {
        buckets.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Every 5 minutes
