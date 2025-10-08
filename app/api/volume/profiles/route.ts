import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
import { z } from 'zod';
import { getDb } from '@/lib/db';
export const runtime = 'nodejs';

const Schema = z.object({
  id: z.string().min(3),
  name: z.string().min(1),
  mint: z.string().min(32),
  mode: z.enum(['BuyOnly', 'BuyThenSell', 'RandomWalk']).default('BuyThenSell'),
  minBuySol: z.number().positive(),
  maxBuySol: z.number().positive(),
  minSellPct: z.number().min(0).max(100).optional(),
  maxSellPct: z.number().min(0).max(100).optional(),
  delaySecMin: z.number().min(1),
  delaySecMax: z.number().min(1),
  slippageBps: z.number().min(1),
  priceImpactCapPct: z.number().min(0),
  buySellBias: z.tuple([z.number().positive(), z.number().positive()]).default([2, 1]),
  maxActions: z.number().int().positive().optional(),
  maxSpendSol: z.number().positive().optional(),
  maxDrawdownPct: z.number().min(0).max(100).optional(),
  timeStopMin: z.number().int().positive().optional(),
  allowTurbo: z.boolean().optional(),
});

export const GET = withSessionAndLimit(async () => {
  const db = await getDb();
  await db.exec(
    'CREATE TABLE IF NOT EXISTS volume_profiles (id TEXT PRIMARY KEY, name TEXT, json TEXT, createdAt INTEGER, updatedAt INTEGER)',
  );
  const rows = await db.all(
    'SELECT id,name,json,updatedAt FROM volume_profiles ORDER BY updatedAt DESC',
  );
  const items = (rows || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    ...JSON.parse(r.json || '{}'),
    updatedAt: r.updatedAt,
  }));
  return { items };
});

export const POST = withSessionAndLimit(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return { error: 'bad_request', details: parsed.error.flatten() };
  const db = await getDb();
  const now = Date.now();
  const { id, name, ...rest } = parsed.data;
  await db.exec(
    'CREATE TABLE IF NOT EXISTS volume_profiles (id TEXT PRIMARY KEY, name TEXT, json TEXT, createdAt INTEGER, updatedAt INTEGER)',
  );
  await db.run(
    `INSERT INTO volume_profiles (id,name,json,createdAt,updatedAt) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, json=excluded.json, updatedAt=excluded.updatedAt`,
    [id, name, JSON.stringify(rest), now, now],
  );
  return { ok: true };
});
