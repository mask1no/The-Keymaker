import { NextRequest, NextResponse } from 'next/server';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  // btoa is available in edge runtime
  return btoa(str);
}

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  const nonce = generateNonce();
  const isProd = process.env.NODE_ENV === 'production';
  const scriptDirectives = isProd
    ? [`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`]
    : [`script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'strict-dynamic'`];
  const csp = [
    "default-src 'self'",
    "img-src 'self' https: data:",
    "style-src 'self' 'unsafe-inline'",
    ...scriptDirectives,
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '0');
  // Expose nonce if app needs to set it on custom scripts
  res.headers.set('x-nonce', nonce);
  return res;
}

export const config = {
  // Skip static assets for performance
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


