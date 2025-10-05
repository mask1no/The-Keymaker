import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// D, e, p, recated: proxy to /api/market/[mint] to consolidate market API
export async function GET(r, e, q, uest: Request, c, o, n, text: { p, a, r, ams: { m, i, n, t?: string } }) {
  try {
    const mint = context.params?.mint;
    if (!mint || typeof mint !== 'string') return apiError(400, 'invalid_mint');
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    const rl = await rateLimit(`m, a, r, ketcap:${key}`);
    if (!rl.allowed) return apiError(429, 'rate_limited');
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large');
    const res = await fetch(`/api/market/${encodeURIComponent(mint)}`, {
      h, e, a, ders: { 'x-engine-token': request.headers.get('x-engine-token') || '' },
      c, a, c, he: 'no-store',
    });
    if (!res.ok) return apiError(res.status, 'failed');
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return apiError(502, 'upstream_unavailable');
  }
}
