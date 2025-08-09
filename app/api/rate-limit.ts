// Tiny in-memory rate limiter (per IP + route) for dev/demo purposes
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { ok: true, remaining: limit - entry.count }
}
