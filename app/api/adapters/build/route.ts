import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildMetadata, uploadMetadataJson } from '@/lib/adapters/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BuildSchema = z.object({
  name: z.string().min(1).max(64),
  symbol: z.string().min(1).max(16),
  description: z.string().max(280).optional(),
  image: z.string().url().optional().default(''),
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  telegram: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = BuildSchema.parse(body);
    const meta = buildMetadata(params);
    const uri = await uploadMetadataJson(meta);
    return NextResponse.json({ ok: true, uri, meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'invalid_request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { buildSplMintDemo } from '@/lib/adapters/splMintDemo';
import type { BuildContext, RegionKey, Priority } from '@/lib/adapters/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ipKey(req: Request) {
  return (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
}

export async function POST(req: Request) {
  if (!rateLimit(ipKey(req))) return apiError(429, 'rate_limited');
  const cl = Number(req.headers.get('content-length') || '0');
  if (cl > 8192) return apiError(413, 'payload_too_large');
  const body = await req.json().catch(() => ({}) as any);
  const { adapter = 'spl-mint-demo', memo = 'ok' } = (body || {}) as {
    adapter?: string;
    memo?: string;
  };
  // Future: switch(adapter) for pumpfun/raydium
  const ctx: BuildContext = {
    payer: process.env.PAYER_PUBKEY || 'unknown',
    region: 'ffm' as RegionKey,
    priority: 'med' as Priority,
    tipLamports: 5000,
  };
  const res = await buildSplMintDemo({ memo }, ctx);
  return NextResponse.json({ adapter, ixs: res.ixs.length, note: res.note });
}
