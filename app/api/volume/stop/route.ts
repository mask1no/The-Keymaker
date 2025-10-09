import { NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { stopVolumeRun } from '@/lib/volume/runner';

const stopSchema = z.object({
  runId: z.number().int().positive(),
});

export const POST = withSessionAndLimit(async (request) => {
  try {
    const body = await request.json();
    const validated = stopSchema.parse(body);

    await stopVolumeRun(validated.runId);

    return NextResponse.json({
      success: true,
      runId: validated.runId,
      status: 'stopped',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to stop volume bot',
      },
      { status: 500 },
    );
  }
});
