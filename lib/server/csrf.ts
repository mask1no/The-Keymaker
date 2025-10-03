import 'server-only';

export const CSRF_COOKIE = 'km_csrf';

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}

export function generateToken(length = 16): string {
  const bytes = new Uint8Array(length);
  // @ts-ignore web crypto available in edge/runtime
  (globalThis.crypto || require('crypto').webcrypto).getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildSetCookie(token: string): string {
  const secure = (process.env.NODE_ENV === 'production') ? '; Secure' : '';
  return `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax${secure}; Max-Age=86400`;
}

export function validateCsrfHeader(request: Request): boolean {
  const cookies = parseCookies(request.headers.get('cookie'));
  const sent = request.headers.get('x-csrf-token') || request.headers.get('X-CSRF-Token');
  const expected = cookies[CSRF_COOKIE];
  if (!expected || !sent) return false;
  return sent === expected;
}


