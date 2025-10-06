import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = [/^\/api\//];
const SESSION_REQUIRED = [/^\/wallets/, /^\/pnl/, /^\/keymaker/, /^\/coin(?!-library)/];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gate app pages requiring session
  const needsSession = SESSION_REQUIRED.some((re) => re.test(pathname));
  if (needsSession) {
    const hasSession = req.cookies.has('km_session');
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect API endpoints with CSRF for state-changing requests
  const isApi = PROTECTED.some((re) => re.test(pathname));
  if (!isApi) return NextResponse.next();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== req.nextUrl.host)
          return new NextResponse('forbidden: origin', { status: 403 });
      } catch {}
    }
    const hdr = req.headers.get('x-csrf-token');
    const cookie = req.cookies.get('csrf')?.value;
    if (!hdr || !cookie || hdr !== cookie)
      return new NextResponse('forbidden: csrf', { status: 403 });
  }
  return NextResponse.next();
}
export const config = {
  matcher: ['/api/:path*', '/wallets/:path*', '/pnl/:path*', '/keymaker/:path*', '/coin'],
};
