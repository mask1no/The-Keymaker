import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';
import { scheduleRun } from '@/lib/volume/runner';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ profileId: z.string().min(3) });

export const POST = withSessionAndLimit(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const { profileId } = Body.parse(body);
  const db = await getDb();
  const now = Date.now();
  const runId = (globalThis.crypto?.randomUUID?.() ||
    Math.random().toString(36).slice(2)) as string;
  await db.run(
    "INSERT INTO volume_runs (id, profile_id, status, started_at, stats_json) VALUES (?, ?, 'running', ?, '{}')",
    [runId, profileId, now],
  );
  const row = await db.get('SELECT json FROM volume_profiles WHERE id = ?', [profileId]);
  const profile = row ? { id: profileId, name: profileId, ...JSON.parse(row.json) } : null;
  if (!profile) throw new Error('profile_not_found');
  await scheduleRun(runId, profile);
  return { ok: true, runId } as any;
});
