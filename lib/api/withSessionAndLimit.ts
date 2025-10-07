import type { NextRequest } from 'next/server';

const buckets = new Map<string, { tokens: number; updated: number }>();
const CAP = 30, REFILL = 1, WINDOW = 1000; // 30/30s, refill 1/s

function okSession(req: NextRequest) {
  // Implement your SIWS session check. Placeholder:
  const sid = req.cookies.get('siws')?.value;
  return sid || null;
}

export function withSessionAndLimit<T>(handler: (req: NextRequest, sid: string) => Promise<T>) {
  return async (req: NextRequest) => {
    const sid = okSession(req);
    if (!sid) return new Response('Unauthorized', { status: 401 });
    // token bucket
    const now = Date.now();
    const b = buckets.get(sid) || { tokens: CAP, updated: now };
    const elapsed = now - b.updated;
    const refill = Math.floor(elapsed / WINDOW) * REFILL;
    b.tokens = Math.min(CAP, b.tokens + refill);
    b.updated = now;
    if (b.tokens <= 0)
      return new Response(JSON.stringify({ error: 'rate_limited', retryAfter: 3 }), {
        status: 429,
        headers: { 'Retry-After': '3', 'content-type': 'application/json' },
      });
    b.tokens--;
    buckets.set(sid, b);
    try {
      const json = await handler(req, sid);
      return new Response(JSON.stringify(json), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || 'internal' }), { status: 500 });
    }
  };
}


