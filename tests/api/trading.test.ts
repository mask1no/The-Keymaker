import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as buyTrade } from '@/app/api/engine/rpc/buy/route';

// Mock dependencies
jest.mock('@/lib/server/session', () => ({
  getSession: jest.fn(() => ({ sub: 'test-user' })),
}));

jest.mock('@/lib/server/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getRateConfig: jest.fn(() => ({ limit: 30, windowMs: 30000 })),
}));

jest.mock('@/lib/db/sqlite', () => ({
  getDb: jest.fn(() => ({
    prepare: jest.fn(() => ({
      get: jest.fn(() => ({ wallet_pubkeys: '["test-wallet"]' })),
      run: jest.fn(() => ({ lastInsertRowid: 1 })),
    })),
  })),
}));

jest.mock('@/lib/engine/trade', () => ({
  multiWalletBuy: jest.fn(() => Promise.resolve([
    {
      wallet: 'test-wallet',
      success: true,
      signature: 'test-signature',
    },
  ])),
}));

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  Keypair: {
    fromSecretKey: jest.fn(() => ({
      publicKey: { toBase58: () => 'test-wallet' },
    })),
  },
}));

jest.mock('bs58', () => ({
  decode: jest.fn(() => new Uint8Array(64)),
}));

jest.mock('@/lib/crypto', () => ({
  decrypt: jest.fn(() => 'decrypted-key'),
}));

describe('Trading API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/engine/rpc/buy', () => {
    it('should execute buy trade successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/engine/rpc/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: 'test-group-id',
          mint: 'So11111111111111111111111111111111111111112',
          perWalletSol: 0.1,
          slippageBps: 300,
          dryRun: true,
        }),
      });

      const response = await buyTrade(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('results');
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toHaveProperty('success', true);
    });

    it('should reject unauthorized requests', async () => {
      const { getSession } = require('@/lib/server/session');
      getSession.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/engine/rpc/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: 'test-group-id',
          mint: 'So11111111111111111111111111111111111111112',
          perWalletSol: 0.1,
          slippageBps: 300,
          dryRun: true,
        }),
      });

      const response = await buyTrade(request);

      expect(response.status).toBe(401);
    });

    it('should reject invalid input', async () => {
      const request = new NextRequest('http://localhost:3000/api/engine/rpc/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: 'test-group-id',
          mint: 'invalid-mint',
          perWalletSol: -1,
          slippageBps: 300,
          dryRun: true,
        }),
      });

      const response = await buyTrade(request);

      expect(response.status).toBe(400);
    });

    it('should handle rate limiting', async () => {
      const { rateLimit } = require('@/lib/server/rateLimit');
      rateLimit.mockReturnValue({ allowed: false });

      const request = new NextRequest('http://localhost:3000/api/engine/rpc/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: 'test-group-id',
          mint: 'So11111111111111111111111111111111111111112',
          perWalletSol: 0.1,
          slippageBps: 300,
          dryRun: true,
        }),
      });

      const response = await buyTrade(request);

      expect(response.status).toBe(429);
    });

    it('should handle trading errors gracefully', async () => {
      const { multiWalletBuy } = require('@/lib/engine/trade');
      multiWalletBuy.mockRejectedValue(new Error('Trading failed'));

      const request = new NextRequest('http://localhost:3000/api/engine/rpc/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: 'test-group-id',
          mint: 'So11111111111111111111111111111111111111112',
          perWalletSol: 0.1,
          slippageBps: 300,
          dryRun: true,
        }),
      });

      const response = await buyTrade(request);

      expect(response.status).toBe(500);
    });
  });
});
