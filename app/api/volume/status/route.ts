import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withSessionAndLimit(async (request: NextRequest) => {
  const url = new URL(request.url);
  const runId = url.searchParams.get('runId');
  const db = await getDb();
  if (!runId) {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS volume_runs (id TEXT PRIMARY KEY, profileId TEXT, status TEXT, startedAt INTEGER, stoppedAt INTEGER, statsJson TEXT)',
    );
    const rows = await db.all(
      'SELECT id, profileId, status, startedAt, stoppedAt, statsJson FROM volume_runs ORDER BY startedAt DESC LIMIT 20',
    );
    return { runs: rows } as any;
  }
  const row = await db.get(
    'SELECT id, profileId, status, startedAt, stoppedAt, statsJson FROM volume_runs WHERE id = ?',
    [runId],
  );
  if (!row) return { error: 'not_found' } as any;
  return { run: row } as any;
});
