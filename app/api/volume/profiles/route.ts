import { NextResponse, NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ProfileSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(1),
  mints: z.array(z.string().min(32)).min(1),
  delaySecMin: z.number().int().min(1).max(600).default(2),
  delaySecMax: z.number().int().min(1).max(600).default(5),
  slippageBps: z.number().int().min(1).max(10_000).default(150),
  bias: z
    .tuple([z.number().int().min(0).default(2), z.number().int().min(0).default(1)])
    .default([2, 1]),
  caps: z
    .object({
      maxActions: z.number().int().positive().optional(),
      maxSpendSol: z.number().positive().optional(),
      timeStopMin: z.number().int().positive().optional(),
      maxDrawdownPct: z.number().positive().max(100).optional(),
    })
    .optional(),
});

export const GET = withSessionAndLimit(async (_req: NextRequest) => {
  const db = await getDb();
  const rows = await db.all('SELECT id, name, json, created_at, updated_at FROM volume_profiles');
  const profiles = (rows || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    ...JSON.parse(r.json),
  }));
  return { profiles } as any;
});

export const POST = withSessionAndLimit(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const p = ProfileSchema.parse(body);
  const db = await getDb();
  const now = Date.now();
  await db.run(
    'INSERT INTO volume_profiles (id, name, json, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, json=excluded.json, updated_at=excluded.updated_at',
    [
      p.id,
      p.name,
      JSON.stringify({
        mints: p.mints,
        delaySecMin: p.delaySecMin,
        delaySecMax: p.delaySecMax,
        slippageBps: p.slippageBps,
        bias: p.bias,
        caps: p.caps || undefined,
      }),
      now,
      now,
    ],
  );
  return { ok: true, profile: p } as any;
});
