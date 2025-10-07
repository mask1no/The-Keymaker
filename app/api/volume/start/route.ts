import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';
import { scheduleRun } from '@/lib/volume/runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ profileId: z.string().min(3) });

export async function POST(request: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const { profileId } = Body.parse(body);
    const db = await getDb();
    const now = Date.now();
    const runId = crypto.randomUUID();
    await db.run(
      "INSERT INTO volume_runs (id, profile_id, status, started_at, stats_json) VALUES (?, ?, 'running', ?, '{}')",
      [runId, profileId, now],
    );
    // Load profile JSON for scheduling
    const row = await db.get('SELECT json FROM volume_profiles WHERE id = ?', [profileId]);
    const profile = row ? { id: profileId, name: profileId, ...JSON.parse(row.json) } : null;
    if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
    await scheduleRun(runId, profile);
    return NextResponse.json({ ok: true, runId });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
