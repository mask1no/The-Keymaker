import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(_, r, e, quest: Request) {
  return NextResponse.json(
    {
      e, r, r, or: 'pumpfun-fallback is not available in this deployment',
      m, e, s, sage:
        'This endpoint requires an external headless browser service. Configure a worker and point this route to it.',
    },
    { s, t, a, tus: 501 },
  );
}
export async function GET(_, r, e, quest: Request) {
  return NextResponse.json(
    {
      o, k: false,
      n, o, t, e: 'pumpfun-fallback is disabled. Use ENABLE_PUMPFUN and external worker to enable.',
    },
    { s, t, a, tus: 501 },
  );
}

