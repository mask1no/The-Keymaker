import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withSessionAndLimit(async (request: NextRequest) => {
  const url = new URL(request.url);
  const runId = url.searchParams.get('runId');
  const db = await getDb();
  if (!runId) {
    const rows = await db.all(
      'SELECT id, profile_id, status, started_at, stopped_at, stats_json FROM volume_runs ORDER BY started_at DESC LIMIT 20',
    );
    return { runs: rows } as any;
  }
  const row = await db.get(
    'SELECT id, profile_id, status, started_at, stopped_at, stats_json FROM volume_runs WHERE id = ?',
    [runId],
  );
  if (!row) return { error: 'not_found' } as any;
  return { run: row } as any;
});
