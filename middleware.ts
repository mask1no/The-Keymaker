import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionValue } from '@/lib/server/session';

const PROTECTED = [/^\/api\//];
const SESSION_REQUIRED = [/^\/wallets/, /^\/pnl/, /^\/keymaker/, /^\/coin(?!-library)/];
const CSRF_EXEMPT = [/^\/api\/auth\//, /^\/api\/health/, /^\/api\/metrics/, /^\/api\/ready/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gate app pages requiring session
  const needsSession = SESSION_REQUIRED.some((re) => re.test(pathname));
  if (needsSession) {
    const sessionCookie = req.cookies.get('km_session')?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect API endpoints
  const isApi = PROTECTED.some((re) => re.test(pathname));
  if (!isApi) return NextResponse.next();

  // Skip CSRF for exempt endpoints
  const isCsrfExempt = CSRF_EXEMPT.some((re) => re.test(pathname));
  if (isCsrfExempt) {
    return NextResponse.next();
  }

  // Enhanced CSRF protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Check origin header
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          console.warn(`CSRF: Origin mismatch - origin: ${origin}, host: ${host}`);
          return new NextResponse('Forbidden: Origin mismatch', { status: 403 });
        }
      } catch {
        return new NextResponse('Forbidden: Invalid origin', { status: 403 });
      }
    }

    // Check referer header as fallback
    const referer = req.headers.get('referer');
    if (referer && host) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          console.warn(`CSRF: Referer mismatch - referer: ${referer}, host: ${host}`);
          return new NextResponse('Forbidden: Referer mismatch', { status: 403 });
        }
      } catch {
        // Invalid referer is acceptable for some legitimate requests
      }
    }

    // Require session for all state-changing API requests
    const sessionCookie = req.cookies.get('km_session')?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      return new NextResponse('Unauthorized: Session required', { status: 401 });
    }
  }

  return NextResponse.next();
}
export const config = {
  matcher: ['/api/:path*', '/wallets/:path*', '/pnl/:path*', '/keymaker/:path*', '/coin'],
};
