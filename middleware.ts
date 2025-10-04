import { NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitIdentifier } from './lib/rateLimit';
import { CSRF_COOKIE, generateToken, parseCookies, validateCsrfHeader } from '@/lib/server/csrf';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle API routes with rate limiting and token validation
  if (path.startsWith('/api/')) {
    // Same-origin check for mutating methods
    if (['POST','PUT','PATCH','DELETE'].includes((req.method || 'GET').toUpperCase())) {
      const origin = req.headers.get('origin');
      if (!origin || new URL(origin).host !== url.host) {
        return new NextResponse('forbidden: origin', { status: 403 });
      }
    }
    // Global kill switch for engine routes
    if (path.startsWith('/api/engine/')) {
      const kill = (process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES';
      if (kill) {
        return NextResponse.json({ ok: false, error: 'live_disabled' }, { status: 503 });
      }
    }
    // Apply rate limiting to all API routes
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(identifier);
    
    if (!rateLimitResult.success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '10',
          'X-Error-Code': 'RATE_LIMITED',
        },
      });
    }
    
    // CSRF token: set for GETs, validate on mutating methods
    if (req.method === 'GET') {
      const res = NextResponse.next();
      const cookies = parseCookies(req.headers.get('cookie'));
      if (!cookies[CSRF_COOKIE]) {
        res.headers.append('Set-Cookie', `${CSRF_COOKIE}=${generateToken()}; Path=/; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}; Max-Age=86400`);
      }
      return res;
    }
    if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
      const ok = validateCsrfHeader(req);
      if (!ok) return new NextResponse('Invalid CSRF token', { status: 403 });
    }

    // Allow unauthenticated SIWS endpoints
    const isPublicAuthEndpoint =
      path === '/api/auth/nonce' || path === '/api/auth/verify';

    // Protected API endpoints require token validation (Edge-safe)
    // Auth endpoints are public (nonce/verify/dev-login) and do not require engine token
    if (path.startsWith('/api/engine/') || path.startsWith('/api/market/')) {
      const token = req.headers.get('x-engine-token');
      const expected = process.env.ENGINE_API_TOKEN;
      const valid = !!token && !!expected && token.length >= 32 && expected.length >= 32 && token === expected;
      if (!valid) {
        return new NextResponse('Unauthorized - Invalid or missing API token', { 
          status: 401,
          headers: {
            'Content-Type': 'text/plain',
            'X-Error-Code': 'INVALID_TOKEN',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          }
        });
      }
    }
    
    // Add rate limit headers to successful API responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString());
    
    return response;
  }
  
  // Allow login route and SIWS endpoints without session
  if (path === '/login' || path.startsWith('/api/auth/')) return NextResponse.next();
  
  // Gate all other routes by presence of valid session cookie
  const hasSession = (req.headers.get('cookie') || '').includes('km_session=');
  if (!hasSession) {
    const to = new URL('/login', req.url);
    return NextResponse.redirect(to);
  }
  
  return NextResponse.next();
}