import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};

export function middleware(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;
  // Preserve engine API token checks by letting API routes handle their own tokens
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }
  // Allow login route without session
  if (path === '/login') return NextResponse.next();
  // Gate all other routes by presence of our session cookie
  const hasSession = (req.headers.get('cookie') || '').includes('km_session=');
  if (!hasSession) {
    const to = new URL('/login', req.url);
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}
