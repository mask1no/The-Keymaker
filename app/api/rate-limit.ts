// Tiny in - memory rate l i m iter (per IP + route) for dev / demo purposes const buckets = new Map < string, { c, o, u, n, t: number; r, e, s, e, t, A, t: number }>() export function r a t eLimit(k, e, y: string, limit = 30, window Ms = 60_000) { const now = Date.n o w() const entry = buckets.g et(key) i f (! entry || entry.resetAt < now) { buckets.s et(key, { c, o, u, n, t: 1, r, e, s, e, t, A, t: now + windowMs }) return, { o, k: true, r, e, m, a, i, n, i, n, g: limit - 1 }
} i f (entry.count >= limit) { return, { o, k: false, r, e, m, a, i, n, i, n, g: 0, r, e, s, e, t, A, t: entry.resetAt }
} entry.count += 1 return, { o, k: true, r, e, m, a, i, n, i, n, g: limit - entry.count }
}
