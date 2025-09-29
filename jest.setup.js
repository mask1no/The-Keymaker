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

// Mock Solana Web3.js to fix import issues
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getSlot: jest.fn().mockResolvedValue(12345),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 100
    })
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key || 'mock-public-key',
    toBase58: () => key || 'mock-public-key'
  })),
  VersionedTransaction: {
    deserialize: jest.fn().mockReturnValue({
      signatures: [new Uint8Array(64)]
    })
  },
  ComputeBudgetProgram: {
    programId: {
      toBase58: jest.fn().mockReturnValue('ComputeBudget111111111111111111111111111111')
    },
    setComputeUnitLimit: jest.fn().mockReturnValue({
      keys: [],
      programId: {
        toBase58: jest.fn().mockReturnValue('ComputeBudget111111111111111111111111111111')
      },
      data: new Uint8Array()
    }),
    setComputeUnitPrice: jest.fn().mockReturnValue({
      keys: [],
      programId: {
        toBase58: jest.fn().mockReturnValue('ComputeBudget111111111111111111111111111111')
      }, 
      data: new Uint8Array()
    })
  }
}));

// Mock Jito core modules
jest.mock('@/lib/core/src/jito', () => ({
  getTipFloor: jest.fn().mockResolvedValue(1000000)
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      json: jest.fn().mockResolvedValue(data)
    })),
    next: jest.fn(() => ({
      headers: new Map()
    })),
    redirect: jest.fn((url) => ({
      status: 307,
      headers: new Map([['location', url]])
    }))
  },
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest.fn().mockResolvedValue(init?.body ? JSON.parse(init.body) : {}),
    text: jest.fn().mockResolvedValue(init?.body || ''),
    clone: jest.fn()
  }))
}));
