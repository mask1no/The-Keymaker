import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return NextResponse.json({
      success: true,
      metrics: {
        memoryUsage,
        uptime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
