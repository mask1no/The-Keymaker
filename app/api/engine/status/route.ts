import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { enginePoll } from '@/lib/core/src/engineFacade';
import type { ExecOptions, ExecutionMode } from '@/lib/core/src/engine';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { incCounter } from '@/lib/server/metricsStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  mode: z.enum(['JITO_BUNDLE', 'RPC_FANOUT']).optional(),
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
  bundleId: z.string().min(4).optional(),
  sigs: z.array(z.string()).optional(),
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
    if (!requireToken(request.headers)) {
      incCounter('token_missing_total');
      incCounter('engine_4xx_total');
      return apiError(401, 'unauthorized');
    }
    if (request.method !== 'POST') {
      incCounter('engine_4xx_total');
      return apiError(405, 'method_not_allowed');
    }
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(key)) {
      incCounter('rate_limited_total');
      return apiError(429, 'rate_limited');
    }
    const cl = Number(request.headers.get('content-length') || '0');
    const LIMIT = 8192;
    if (cl > LIMIT) {
      incCounter('payload_too_large_total');
      return apiError(413, 'payload_too_large');
    }
    const rawText = await request.text();
    if (Buffer.byteLength(rawText || '', 'utf8') > LIMIT) {
      incCounter('payload_too_large_total');
      return apiError(413, 'payload_too_large');
    }
    const body = rawText ? JSON.parse(rawText) : {};
    const { mode = 'JITO_BUNDLE', region = 'ffm', bundleId, sigs } = Body.parse(body);
    const opts: ExecOptions = {
      mode: mode as ExecutionMode,
      region: region as any,
      bundleIds: bundleId ? [bundleId] : undefined,
      sigs: sigs || undefined,
    } as any;
    const statuses = await enginePoll(null, opts);
    const res = NextResponse.json({ statuses, requestId });
    incCounter('engine_status_total');
    incCounter('engine_2xx_total');
    return res;
  } catch {
    incCounter('engine_5xx_total');
    return apiError(500, 'failed');
  }
}
