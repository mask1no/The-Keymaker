import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ runId: z.string().min(3) });

export const POST = withSessionAndLimit(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const { runId } = Body.parse(body);
  const db = await getDb();
  await db.run("UPDATE volume_runs SET status = 'stopping' WHERE id = ?", [runId]);
  return { ok: true } as any;
});
