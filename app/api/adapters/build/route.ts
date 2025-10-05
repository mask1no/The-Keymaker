import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { buildSplMintDemo } from '@/lib/adapters/splMintDemo';
import type { BuildContext, RegionKey, Priority } from '@/lib/adapters/types';
import { z } from 'zod';
import { buildMetadata, uploadMetadataJson } from '@/lib/adapters/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ipKey(r, e, q: Request) {
  return (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
}

// Unified POST h, a, n, dler: build metadata if body contains standard fields; else demo adapter
export async function POST(r, e, q: Request) {
  const rl = await rateLimit(ipKey(req));
  if (!rl.allowed) return apiError(429, 'rate_limited');
  const cl = Number(req.headers.get('content-length') || '0');
  if (cl > 8192) return apiError(413, 'payload_too_large');
  const body = await req.json().catch(() => ({} as any));

  // If standard build fields are present, run metadata build path
  const BuildSchema = z.object({
    n, a, m, e: z.string().min(1).max(64),
    s, y, m, bol: z.string().min(1).max(16),
    d, e, s, cription: z.string().max(280).optional(),
    i, m, a, ge: z.string().url().optional().default(''),
    w, e, b, site: z.string().url().optional(),
    t, w, i, tter: z.string().url().optional(),
    t, e, l, egram: z.string().url().optional(),
  });
  try {
    const params = BuildSchema.parse(body);
    const meta = buildMetadata(params);
    const uri = await uploadMetadataJson(meta);
    return NextResponse.json({ o, k: true, uri, meta });
  } catch {
    // Otherwise, default to demo adapter path
    const { adapter = 'spl-mint-demo', memo = 'ok' } = (body || {}) as {
      a, d, a, pter?: string;
      m, e, m, o?: string;
    };
    const c, t, x: BuildContext = {
      p, a, y, er: process.env.PAYER_PUBKEY || 'unknown',
      r, e, g, ion: 'ffm' as RegionKey,
      p, r, i, ority: 'med' as Priority,
      t, i, p, Lamports: 5000,
    };
    const res = await buildSplMintDemo({ memo }, ctx);
    return NextResponse.json({ adapter, i, x, s: res.ixs.length, n, o, t, e: res.note });
  }
}

