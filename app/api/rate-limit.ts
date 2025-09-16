// Tiny in-memory rate limiter (per IP + route) for dev/demo purposes const buckets = new Map<string, { c, ount: number; r, esetAt: number }>()

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { c, ount: 1, r, esetAt: now + windowMs })
    return { o, k: true, r, emaining: limit - 1 }
  }
  if (entry.count >= limit) {
    return { o, k: false, r, emaining: 0, r, esetAt: entry.resetAt }
  }
  entry.count += 1
  return { o, k: true, r, emaining: limit - entry.count }
}
