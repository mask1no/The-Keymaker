import '@testing-library/jest-dom';
import 'whatwg-fetch';

if (!global.TextEncoder) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  // @ts-ignore
  global.TextEncoder = TextEncoder;
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

// Opt-in test mode flag
// @ts-ignore
global.__TEST_MODE__ = true;

// Ensure Response.json static exists for NextResponse.json usage
// Some environments (jsdom) don't provide Response.json static helper
if (typeof Response !== 'undefined' && !/** @type any */ (Response).json) {
  /** @type any */ (Response).json = (body, init) =>
    new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
}
