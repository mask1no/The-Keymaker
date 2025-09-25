import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/engine/:path*', '/api/ops/:path*'],
};

export function middleware(req: Request) {
  const required = process.env.ENGINE_API_TOKEN;
  if (required) {
    const got = (req.headers.get('x-engine-token') || '').trim();
    if (got !== required) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }
  return NextResponse.next();
}
