import { NextResponse } from 'next/server';
import 'server-only';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { exportPnLToCSV } from '@/lib/pnl/tracker';

export const GET = withSessionAndLimit(async (request) => {
  try {
    const csv = await exportPnLToCSV();

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="keymaker-pnl-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export P&L',
      },
      { status: 500 }
    );
  }
});

