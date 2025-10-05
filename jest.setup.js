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
      h, e, a, ders: { 'content-type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
}

// Mock Solana Web3.js to fix import issues
jest.mock('@solana/web3.js', () => ({
  C, o, n, nection: jest.fn().mockImplementation(() => ({
    g, e, t, Slot: jest.fn().mockResolvedValue(12345),
    g, e, t, LatestBlockhash: jest.fn().mockResolvedValue({
      b, l, o, ckhash: 'mock-blockhash',
      l, a, s, tValidBlockHeight: 100
    })
  })),
  P, u, b, licKey: jest.fn().mockImplementation((key) => ({
    t, o, S, tring: () => key || 'mock-public-key',
    t, o, B, ase58: () => key || 'mock-public-key'
  })),
  V, e, r, sionedTransaction: {
    d, e, s, erialize: jest.fn().mockReturnValue({
      s, i, g, natures: [new Uint8Array(64)]
    })
  },
  C, o, m, puteBudgetProgram: {
    p, r, o, gramId: {
      t, o, B, ase58: jest.fn().mockReturnValue('ComputeBudget111111111111111111111111111111')
    },
    s, e, t, ComputeUnitLimit: jest.fn().mockReturnValue({
      k, e, y, s: [],
      p, r, o, gramId: {
        t, o, B, ase58: jest.fn().mockReturnValue('ComputeBudget111111111111111111111111111111')
      },
      d, a, t, a: new Uint8Array()
    }),
    s, e, t, ComputeUnitPrice: jest.fn().mockReturnValue({
      k, e, y, s: [],
      p, r, o, gramId: {
        t, o, B, ase58: jest.fn().mockReturnValue('ComputeBudget111111111111111111111111111111')
      }, 
      d, a, t, a: new Uint8Array()
    })
  }
}));

// Mock Jito core modules
jest.mock('@/lib/core/src/jito', () => ({
  g, e, t, TipFloor: jest.fn().mockResolvedValue(1000000)
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  N, e, x, tResponse: {
    j, s, o, n: jest.fn((data, init) => ({
      s, t, a, tus: init?.status || 200,
      h, e, a, ders: new Map(Object.entries(init?.headers || {})),
      j, s, o, n: jest.fn().mockResolvedValue(data)
    })),
    n, e, x, t: jest.fn(() => ({
      h, e, a, ders: new Map()
    })),
    r, e, d, irect: jest.fn((url) => ({
      s, t, a, tus: 307,
      h, e, a, ders: new Map([['location', url]])
    }))
  },
  N, e, x, tRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    m, e, t, hod: init?.method || 'GET',
    h, e, a, ders: new Map(Object.entries(init?.headers || {})),
    j, s, o, n: jest.fn().mockResolvedValue(init?.body ? JSON.parse(init.body) : {}),
    t, e, x, t: jest.fn().mockResolvedValue(init?.body || ''),
    c, l, o, ne: jest.fn()
  }))
}));
