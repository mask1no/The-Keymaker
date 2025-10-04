import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
// Fallback status stub to avoid importing engine internals during UI-only build
async function enginePoll(_id: string | null, _opts: any) {
  return [] as any[];
}
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
  bundleIds: z.array(z.string().min(4)).optional(),
  sigs: z.array(z.string()).optional(),
  cluster: z.enum(['mainnet-beta', 'devnet']).optional(),
});

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (process.env.NODE_ENV === 'production') {
    if (!expected) return false;
    const got = headers.get('x-engine-token');
    return got === expected;
  }
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

export async function POST(request: Request) {
  try {
    const requestId = randomUUID();
    if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
      incCounter('engine_4xx_total');
      return apiError(503, 'live_disabled', requestId);
    }
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
    const rl = await rateLimit(`engine:${key}`);
    if (!rl.allowed) {
      incCounter('rate_limited_total');
      return apiError(429, 'rate_limited', requestId);
    }
    const cl = Number(request.headers.get('content-length') || '0');
    const LIMIT = 8192;
    if (cl > LIMIT) {
      incCounter('payload_too_large_total');
      return apiError(413, 'payload_too_large', requestId);
    }
    const rawText = await request.text();
    if (Buffer.byteLength(rawText || '', 'utf8') > LIMIT) {
      incCounter('payload_too_large_total');
      return apiError(413, 'payload_too_large', requestId);
    }
    const body = rawText ? JSON.parse(rawText) : {};
    const { mode = 'JITO_BUNDLE', region = 'ffm', bundleId, bundleIds, sigs, cluster } = Body.parse(body);
    const opts: ExecOptions = {
      mode: mode as ExecutionMode,
      region: region as any,
      bundleIds: bundleIds && bundleIds.length ? bundleIds : bundleId ? [bundleId] : undefined,
      sigs: sigs || undefined,
      cluster: cluster || 'mainnet-beta',
    } as any;
    const statuses = await enginePoll(null, opts);
    const res = NextResponse.json({ statuses, requestId });
    incCounter('engine_status_total');
    incCounter('engine_2xx_total');
    return res;
  } catch (e: unknown) {
    try {
      Sentry.captureException(e instanceof Error ? e : new Error('engine_status_failed'), {
        extra: { route: '/api/engine/status' },
      });
    } catch {}
    incCounter('engine_5xx_total');
    return apiError(500, 'failed');
  }
}
