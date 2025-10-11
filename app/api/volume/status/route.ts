import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VolumeRun {
  id: string;
  profileId: string;
  status: string;
  startedAt: number;
  stoppedAt: number | null;
  statsJson: string;
}

export const GET = withSessionAndLimit(async (request: NextRequest) => {
  const url = new URL(request.url);
  const runId = url.searchParams.get('runId');
  const db = await getDb();

  if (!runId) {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS volume_runs (id TEXT PRIMARY KEY, profileId TEXT, status TEXT, startedAt INTEGER, stoppedAt INTEGER, statsJson TEXT)',
    );
    const rows = (await db.all(
      'SELECT id, profileId, status, startedAt, stoppedAt, statsJson FROM volume_runs ORDER BY startedAt DESC LIMIT 20',
    )) as VolumeRun[];
    return NextResponse.json({ runs: rows });
  }

  const row = (await db.get(
    'SELECT id, profileId, status, startedAt, stoppedAt, statsJson FROM volume_runs WHERE id = ?',
    [runId],
  )) as VolumeRun | undefined;

  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ run: row });
});
