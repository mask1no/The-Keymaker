import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getBundleStatuses } from '@/lib/core/src/jito';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { incCounter } from '@/lib/server/metricsStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']),
  bundleId: z.string().min(4),
});

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

export async function POST(request: Request) {
  try {
    const requestId = randomUUID();
    if (!requireToken(request.headers)) return apiError(401, 'unauthorized');
    if (request.method !== 'POST') return apiError(405, 'method_not_allowed');
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(key)) {
      incCounter('rate_limited_total');
      return apiError(429, 'rate_limited');
    }
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) {
      incCounter('payload_too_large_total');
      return apiError(413, 'payload_too_large');
    }
    const body = await request.json();
    const { region, bundleId } = Body.parse(body);
    const statuses = await getBundleStatuses(region, [bundleId]);
    const res = NextResponse.json({ statuses, requestId });
    incCounter('engine_status_total');
    incCounter('engine_2xx_total');
    return res;
  } catch {
    incCounter('engine_5xx_total');
    return apiError(500, 'failed');
  }
}
