import { NextResponse } from 'next/server';
import 'server-only';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { getVolumeRunStatus } from '@/lib/volume/runner';

export const GET = withSessionAndLimit(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const runId = parseInt(searchParams.get('runId') || '0');

    if (!runId) {
      return NextResponse.json({ error: 'runId required' }, { status: 400 });
    }

    const status = await getVolumeRunStatus(runId);

    if (!status) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      run: status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get status',
      },
      { status: 500 }
    );
  }
});

