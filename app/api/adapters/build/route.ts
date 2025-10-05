import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { buildSplMintDemo } from '@/lib/adapters/splMintDemo';
import type { BuildContext, RegionKey, Priority } from '@/lib/adapters/types';
import { z } from 'zod';
import { buildMetadata, uploadMetadataJson } from '@/lib/adapters/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ipKey(req: Request) {
  return (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
}

// Unified POST handler: build metadata if body contains standard fields; else demo adapter
export async function POST(req: Request) {
  const rl = await rateLimit(ipKey(req));
  if (!rl.allowed) return apiError(429, 'rate_limited');
  const cl = Number(req.headers.get('content-length') || '0');
  if (cl > 8192) return apiError(413, 'payload_too_large');
  const body = await req.json().catch(() => ({} as any));

  // If standard build fields are present, run metadata build path
  const BuildSchema = z.object({
    name: z.string().min(1).max(64),
    symbol: z.string().min(1).max(16),
    description: z.string().max(280).optional(),
    image: z.string().url().optional().default(''),
    website: z.string().url().optional(),
    twitter: z.string().url().optional(),
    telegram: z.string().url().optional(),
  });
  try {
    const params = BuildSchema.parse(body);
    const meta = buildMetadata(params);
    const uri = await uploadMetadataJson(meta);
    return NextResponse.json({ ok: true, uri, meta });
  } catch {
    // Otherwise, default to demo adapter path
    const { adapter = 'spl-mint-demo', memo = 'ok' } = (body || {}) as {
      adapter?: string;
      memo?: string;
    };
    const ctx: BuildContext = {
      payer: process.env.PAYER_PUBKEY || 'unknown',
      region: 'ffm' as RegionKey,
      priority: 'med' as Priority,
      tipLamports: 5000,
    };
    const res = await buildSplMintDemo({ memo }, ctx);
    return NextResponse.json({ adapter, ixs: res.ixs.length, note: res.note });
  }
}

