import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request) {
  try {
    const conn = getDb();
    const stmt = conn.prepare(
      'SELECT id, executedAt as executed_at, status, outcomes FROM bundles ORDER BY id DESC LIMIT 10'
    );
    const rows = stmt.all();
    const recent = rows.map((r: any) => ({
      id: r.id,
      executed_at: r.executed_at,
      status: r.status,
      outcomes: (() => {
        try {
          return JSON.parse(r.outcomes || '{}');
        } catch {
          return {};
        }
      })(),
    }));
    return NextResponse.json({ recent });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
