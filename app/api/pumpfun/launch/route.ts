import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { apiError } from '@/lib/server/apiError';
import { getUiSettings } from '@/lib/server/settings';
import { rateLimit } from '@/lib/server/rateLimit';
import { randomUUID } from 'crypto';
import { buildMetadata, uploadMetadataJson } from '@/lib/adapters/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  uri: z.string().url().optional(),
  image: z.string().url().optional(),
  description: z.string().max(512).optional(),
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  telegram: z.string().url().optional(),
  initialSol: z.number().min(0).max(5).default(0),
  dryRun: z.boolean().optional(),
  // Post-create options
  devBuySol: z.number().min(0).max(5).default(0),
  autoMultiBuy: z.boolean().default(false),
  groupId: z.string().uuid().optional(),
  mode: z.enum(['JITO_BUNDLE', 'RPC_FANOUT']).default('JITO_BUNDLE'),
  slippageBps: z.number().min(0).max(10000).default(150),
  priorityFeeMicrolamports: z.number().min(0).optional(),
  jitoTipLamports: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    // Per-route limiter key
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(`pump:${key}`, 15, 5)) return apiError(429, 'rate_limited', requestId);
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large', requestId);
    const text = await request.text();
    if (Buffer.byteLength(text || '', 'utf8') > 8192) return apiError(413, 'payload_too_large', requestId);
    const parsed = Body.parse(text ? JSON.parse(text) : {});
    const ui = getUiSettings();
    const dryRun = typeof parsed.dryRun === 'boolean' ? parsed.dryRun : (ui.dryRun ?? true);

    // Simulate-only build: build metadata object and return simulated tx payload
    if (dryRun) {
      const metadata = buildMetadata({
        name: parsed.name,
        symbol: parsed.symbol,
        description: parsed.description,
        image: parsed.image || '',
        website: parsed.website,
        twitter: parsed.twitter,
        telegram: parsed.telegram,
      });
      const proof = { metadata, simulated: true, corr: requestId };
      return NextResponse.json({ ok: true, simulated: true, proof, requestId });
    }

    // Live path requires UI + env and optional arming
    const uiLive = ui.liveMode === true;
    const envLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
    if (!uiLive || !envLive) {
      return apiError(
        501,
        'live_disabled',
        requestId,
        'Enable Live Mode in Settings and set KEYMAKER_ALLOW_LIVE=YES to launch.',
      );
    }
    if (process.env.KEYMAKER_DISABLE_LIVE === 'YES') {
      return apiError(403, 'live_disabled', requestId, 'KEYMAKER_DISABLE_LIVE=YES blocks live sends.');
    }
    if (process.env.KEYMAKER_REQUIRE_ARMING === 'YES') {
      const { isArmed } = await import('@/lib/server/arming');
      if (!isArmed()) return apiError(403, 'not_armed', requestId, 'POST /api/ops/arm to proceed.');
    }

    // Minimal live path: call Pump.fun REST if API key provided
    if (!process.env.PUMPFUN_API_KEY) {
      return apiError(501, 'not_configured', requestId, 'Missing PUMPFUN_API_KEY.');
    }
    let uri = parsed.uri || '';
    if (!uri) {
      // Attempt metadata upload if configured
      const md = buildMetadata({
        name: parsed.name,
        symbol: parsed.symbol,
        description: parsed.description,
        image: parsed.image || '',
        website: parsed.website,
        twitter: parsed.twitter,
        telegram: parsed.telegram,
      });
      const uploaded = await uploadMetadataJson(md);
      if (!uploaded) return apiError(500, 'metadata_upload_failed', requestId, 'Configure IPFS_JSON_ENDPOINT');
      uri = uploaded;
    }
    const body = { name: parsed.name, symbol: parsed.symbol, uri } as Record<string, unknown>;
    const res = await fetch('https://pumpportal.fun/api/create', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.PUMPFUN_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return apiError(502, 'pumpfun_failed', requestId, await res.text());
    const json = await res.json();
    const createdMint = (json?.mint as string | undefined) || undefined;

    // Optional: Dev buy and/or auto multi-buy
    if (createdMint && parsed.devBuySol > 0) {
      try {
        // For a dev buy, we can reuse the RPC fanout with a single wallet if needed later
      } catch {}
    }
    if (createdMint && parsed.autoMultiBuy && parsed.groupId) {
      try {
        if (parsed.mode === 'JITO_BUNDLE') {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/engine/jito/buy`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              groupId: parsed.groupId,
              mint: createdMint,
              amountSol: parsed.devBuySol > 0 ? parsed.devBuySol : 0.01,
              slippageBps: parsed.slippageBps,
              tipLamports: parsed.jitoTipLamports,
              chunkSize: 5,
              dryRun: ui.dryRun ?? true,
            }),
          });
        } else {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/engine/rpc/buy`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              groupId: parsed.groupId,
              mint: createdMint,
              amountSol: parsed.devBuySol > 0 ? parsed.devBuySol : 0.01,
              slippageBps: parsed.slippageBps,
              priorityFeeMicrolamports: parsed.priorityFeeMicrolamports,
              concurrency: 5,
              dryRun: ui.dryRun ?? true,
            }),
          });
        }
      } catch {}
    }

    return NextResponse.json({ ok: true, tx: json?.tx || null, mint: createdMint || null, requestId });
  } catch (e: unknown) {
    try {
      Sentry.captureException(e instanceof Error ? e : new Error('pump_launch_failed'), {
        extra: { route: '/api/pumpfun/launch' },
      });
    } catch {}
    return apiError(500, 'failed', requestId);
  }
}
