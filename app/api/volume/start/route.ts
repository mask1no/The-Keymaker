import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
import { z } from 'zod';
import { getDb } from '@/lib/db';
export const runtime = 'nodejs';
const Body = z.object({ profileId: z.string().min(3) });

export const POST = withSessionAndLimit(async (req: NextRequest) => {
  const body = Body.parse(await req.json());
  const db = await getDb();
  const now = Date.now();
  const id = `run_${now}_${Math.random().toString(16).slice(2)}`;
  await db.exec(
    'CREATE TABLE IF NOT EXISTS volume_runs (id TEXT PRIMARY KEY, profileId TEXT, status TEXT, startedAt INTEGER, stoppedAt INTEGER, statsJson TEXT)',
  );
  await db.run('INSERT INTO volume_runs(id,profileId,status,startedAt) VALUES (?,?,?,?)', [
    id,
    body.profileId,
    'running',
    now,
  ]);
  return { runId: id, status: 'running' };
});
