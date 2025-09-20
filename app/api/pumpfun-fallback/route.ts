import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'pumpfun-fallback is not available in this deployment',
      message:
        'This endpoint requires an external headless browser service. Configure a worker and point this route to it.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      note: 'pumpfun-fallback is disabled. Use ENABLE_PUMPFUN and external worker to enable.',
    },
    { status: 501 },
  );
}
