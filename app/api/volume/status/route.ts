import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const runId = url.searchParams.get('runId');
    const db = await getDb();
    if (!runId) {
      const rows = await db.all(
        'SELECT id, profile_id, status, started_at, stopped_at, stats_json FROM volume_runs ORDER BY started_at DESC LIMIT 20',
      );
      return NextResponse.json({ runs: rows });
    }
    const row = await db.get(
      'SELECT id, profile_id, status, started_at, stopped_at, stats_json FROM volume_runs WHERE id = ?',
      [runId],
    );
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ run: row });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
