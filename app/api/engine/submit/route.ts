import { NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { z } from 'zod';
import {
  Connection,
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { readFileSync } from 'fs';
import { PRIORITY_TO_MICROLAMPORTS } from '@/lib/core/src/types';
import { submitViaJito, submitViaRpc } from '@/lib/core/src/engineFacade';
import type { ExecOptions, ExecutionMode } from '@/lib/core/src/engine';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { incCounter } from '@/lib/server/metricsStore';
import { getUiSettings } from '@/lib/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  mode: z.enum(['JITO_BUNDLE', 'RPC_FANOUT']).optional(),
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
  tipLamports: z.number().int().nonnegative().optional(),
  priority: z.enum(['low', 'med', 'high', 'vhigh']).optional(),
  chunkSize: z.number().int().min(1).max(20).optional(),
  concurrency: z.number().int().min(1).max(16).optional(),
  jitterMs: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  dryRun: z.boolean().optional(),
  cluster: z.enum(['mainnet-beta', 'devnet']).optional(),
});

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

function rpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
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
      incCounter('engine_4xx_total');
      return apiError(413, 'payload_too_large');
    }
    const rawText = await request.text();
    if (Buffer.byteLength(rawText || '', 'utf8') > LIMIT) {
      incCounter('payload_too_large_total');
      incCounter('engine_4xx_total');
      return apiError(413, 'payload_too_large');
    }
    const body = rawText ? JSON.parse(rawText) : {};
    const parsed = Body.parse(body);
    const ui = getUiSettings();
    const mode: ExecutionMode = (parsed.mode || ui.mode || 'JITO_BUNDLE') as ExecutionMode;
    const region = (parsed.region || ui.region || 'ffm') as 'ffm' | 'ams' | 'ny' | 'tokyo';
    const tipLamports = parsed.tipLamports ?? ui.tipLamports;
    const priority = (parsed.priority || ui.priority || 'med') as 'low' | 'med' | 'high' | 'vhigh';
    const chunkSize = parsed.chunkSize ?? ui.chunkSize;
    const concurrency = parsed.concurrency ?? ui.concurrency;
    const jitterMs = parsed.jitterMs ?? ui.jitterMs;
    const dryRun = typeof parsed.dryRun === 'boolean' ? parsed.dryRun : (ui.dryRun ?? true);
    const cluster = parsed.cluster || ui.cluster || 'mainnet-beta';

    const keyPath = process.env.KEYPAIR_JSON;
    if (!keyPath) return apiError(400, 'not_configured');
    const raw = readFileSync(keyPath, 'utf8');
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));

    const conn = new Connection(rpcUrl(), 'confirmed');
    const { blockhash } = await conn.getLatestBlockhash('confirmed');
    // priority mapped to micros; reserved for future use
    // priority mapped to micros; reserved for future logging/metrics
    void PRIORITY_TO_MICROLAMPORTS[priority];

    const ix = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: payer.publicKey,
      lamports: 0,
    });
    const msg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    tx.sign([payer]);
    const encoded = Buffer.from(tx.serialize()).toString('base64');
    const corr = createHash('sha256').update(Buffer.from(encoded)).digest('hex');
    incCounter('engine_submit_total');
    const plan = { txs: [tx], corr };
    const opts: ExecOptions = {
      mode,
      region,
      priority,
      tipLamports,
      chunkSize,
      concurrency,
      jitterMs,
      dryRun,
      cluster,
    } as ExecOptions;
    if (!dryRun) {
      const { isArmed } = await import('@/lib/server/arming');
      if (!isArmed()) return apiError(403, 'not_armed');
    }
    const submit =
      mode === 'JITO_BUNDLE' ? await submitViaJito(plan, opts) : await submitViaRpc(plan, opts);
    const res = NextResponse.json({ ...submit, status: submit.statusHint, requestId });
    incCounter('engine_2xx_total');
    return res;
  } catch {
    incCounter('engine_5xx_total');
    return apiError(500, 'failed');
  }
}
