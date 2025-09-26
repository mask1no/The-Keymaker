import '@testing-library/jest-dom';
import 'whatwg-fetch';

if (!global.TextEncoder || !global.TextDecoder) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  // @ts-ignore
  global.TextEncoder = global.TextEncoder || TextEncoder;
  // @ts-ignore
  global.TextDecoder = global.TextDecoder || TextDecoder;
}

// Opt-in test mode flag
// @ts-ignore
global.__TEST_MODE__ = true;

try {
  // @ts-ignore
  if (typeof window !== 'undefined') window.__TEST_MODE__ = true;
} catch {}

// Ensure Response.json static exists for NextResponse.json usage
// Some environments (jsdom) don't provide Response.json static helper
if (typeof Response !== 'undefined' && !(/** @type any */ (Response).json)) {
  /** @type any */ (Response).json = (body, init) =>
    new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
}
