import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Upsert = z.object({
  id: z.string().min(3),
  name: z.string().min(1),
  strategy: z.enum(['equal', 'per_wallet', 'target', 'volume_stipend']),
  json: z.record(z.string(), z.any()),
});

export async function GET() {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const db = await getDb();
    const rows = await db.all('SELECT * FROM funding_presets ORDER BY updated_at DESC');
    const presets = (rows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      strategy: r.strategy,
      json: JSON.parse(r.json),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return NextResponse.json({ presets }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const p = Upsert.parse(body);
    const db = await getDb();
    const now = Date.now();
    await db.run(
      'INSERT INTO funding_presets (id, name, strategy, json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, strategy=excluded.strategy, json=excluded.json, updated_at=excluded.updated_at',
      [p.id, p.name, p.strategy, JSON.stringify(p.json), now, now],
    );
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
