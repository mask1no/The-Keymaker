import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getNonce } from '@/app/api/auth/nonce/route';
import { POST as verifyAuth } from '@/app/api/auth/verify/route';

// Mock dependencies
jest.mock('@/lib/server/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
}));

jest.mock('@/lib/server/session', () => ({
  generateNonce: jest.fn(() => 'test-nonce-123'),
  validateAndConsumeNonce: jest.fn(() => true),
  buildCanonicalLoginMessage: jest.fn(() => 'Keymaker-Login|pubkey=test|ts=2023-01-01T00:00:00.000Z|nonce=test-nonce-123'),
  setSessionCookie: jest.fn(),
}));

jest.mock('tweetnacl', () => ({
  sign: {
    detached: {
      verify: jest.fn(() => true),
    },
  },
}));

jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn(() => ({
    toBytes: () => new Uint8Array(32),
  })),
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/auth/nonce', () => {
    it('should return a nonce', async () => {
      const request = new NextRequest('http://localhost:3001/api/auth/nonce');
      const response = await getNonce(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('nonce');
      expect(typeof data.nonce).toBe('string');
    });

    it('should handle rate limiting', async () => {
      const { rateLimit } = require('@/lib/server/rateLimit');
      rateLimit.mockReturnValue({ allowed: false });

      const request = new NextRequest('http://localhost:3001/api/auth/nonce');
      const response = await getNonce(request);

      expect(response.status).toBe(429);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid signature', async () => {
      const request = new NextRequest('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pubkey: 'test-pubkey',
          tsIso: '2023-01-01T00:00:00.000Z',
          nonce: 'test-nonce-123',
          messageBase64: Buffer.from('test-message').toString('base64'),
          signatureBase64: Buffer.from('test-signature').toString('base64'),
        }),
      });

      const response = await verifyAuth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('ok', true);
    });

    it('should reject invalid signature', async () => {
      const { nacl } = require('tweetnacl');
      nacl.sign.detached.verify.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pubkey: 'test-pubkey',
          tsIso: '2023-01-01T00:00:00.000Z',
          nonce: 'test-nonce-123',
          messageBase64: Buffer.from('test-message').toString('base64'),
          signatureBase64: Buffer.from('test-signature').toString('base64'),
        }),
      });

      const response = await verifyAuth(request);

      expect(response.status).toBe(400);
    });

    it('should reject invalid nonce', async () => {
      const { validateAndConsumeNonce } = require('@/lib/server/session');
      validateAndConsumeNonce.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pubkey: 'test-pubkey',
          tsIso: '2023-01-01T00:00:00.000Z',
          nonce: 'invalid-nonce',
          messageBase64: Buffer.from('test-message').toString('base64'),
          signatureBase64: Buffer.from('test-signature').toString('base64'),
        }),
      });

      const response = await verifyAuth(request);

      expect(response.status).toBe(400);
    });

    it('should reject payload too large', async () => {
      const largePayload = 'x'.repeat(10000);
      
      const request = new NextRequest('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '10000',
        },
        body: JSON.stringify({
          pubkey: largePayload,
          tsIso: '2023-01-01T00:00:00.000Z',
          nonce: 'test-nonce-123',
          messageBase64: Buffer.from('test-message').toString('base64'),
          signatureBase64: Buffer.from('test-signature').toString('base64'),
        }),
      });

      const response = await verifyAuth(request);

      expect(response.status).toBe(413);
    });
  });
});
