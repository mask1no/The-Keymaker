import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPrisma } from '@/lib/server/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const prisma = getPrisma();
    let landed = 0;
    let dropped = 0;
    let avgRttMs = 0;
    if (prisma) {
      landed = await prisma.bundle.count({ where: { status: 'landed' } });
      dropped = await prisma.bundle.count({
        where: { status: { in: ['failed', 'timeout', 'invalid'] } },
      });
      const logs = await prisma.executionLog.findMany({
        where: { action: 'health', status: 'ok' },
        orderBy: { id: 'desc' },
        take: 10,
      });
      const rtts = logs.map((l: any) => Number((l.details as any)?.latency_ms) || 0);
      avgRttMs = rtts.length ? Math.round(rtts.reduce((a, x) => a + x, 0) / rtts.length) : 0;
    } else {
      const conn = await db;
      const [landedRow] = await conn.all(
        "SELECT COUNT(*) as c FROM bundles WHERE status = 'landed'",
      );
      const [droppedRow] = await conn.all(
        "SELECT COUNT(*) as c FROM bundles WHERE status IN ('failed','timeout','invalid')",
      );
      const rtts = await conn.all(
        "SELECT json_extract(details,'$.latency_ms') as rtt FROM execution_logs WHERE action='health' AND status='ok' ORDER BY id DESC LIMIT 10",
      );
      avgRttMs =
        rtts && rtts.length
          ? Math.round(
              rtts.reduce((a: number, x: any) => a + (Number(x.rtt) || 0), 0) / rtts.length,
            )
          : 0;
      landed = Number(landedRow?.c || 0);
      dropped = Number(droppedRow?.c || 0);
    }
    const metrics = {
      bundlesLanded: landed,
      bundlesDropped: dropped,
      avgRttMs,
      version: process.env.npm_package_version || 'dev',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get metrics' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
