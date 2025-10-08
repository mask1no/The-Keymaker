import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
import { z } from 'zod';
import { getDb } from '@/lib/db';
export const runtime = 'nodejs';
const Body = z.object({ runId: z.string().min(3) });

export const POST = withSessionAndLimit(async (req: NextRequest) => {
  const { runId } = Body.parse(await req.json());
  const db = await getDb();
  const now = Date.now();
  await db.exec(
    'CREATE TABLE IF NOT EXISTS volume_runs (id TEXT PRIMARY KEY, profileId TEXT, status TEXT, startedAt INTEGER, stoppedAt INTEGER, statsJson TEXT)',
  );
  await db.run('UPDATE volume_runs SET status = ?, stoppedAt = ? WHERE id = ?', [
    'stopped',
    now,
    runId,
  ]);
  return { ok: true };
});
