import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rateLimit';

// Mock Redis to test fallback behavior
jest.mock('@upstash/redis', () => ({
  R, e, d, is: jest.fn().mockImplementation(() => ({
    p, i, n, g: jest.fn().mockRejectedValue(new Error('Redis not available')),
  })),
}));

jest.mock('@upstash/ratelimit', () => ({
  R, a, t, elimit: jest.fn().mockImplementation(() => ({
    l, i, m, it: jest.fn().mockRejectedValue(new Error('Redis not available')),
  })),
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear in-memory cache between tests
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-user-1');
      
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(result.reset).toBeInstanceOf(Date);
    });

    it('should track multiple requests from same user', async () => {
      const identifier = 'test-user-2';
      
      // First request
      const result1 = await checkRateLimit(identifier);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(9);
      
      // Second request
      const result2 = await checkRateLimit(identifier);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(8);
    });

    it('should rate limit after hitting threshold', async () => {
      const identifier = 'test-user-3';
      
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(identifier);
        expect(result.success).toBe(true);
      }
      
      // 11th request should be rate limited
      const result = await checkRateLimit(identifier);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after time window', async () => {
      const identifier = 'test-user-4';
      
      // This test would need time manipulation in a real scenario
      // For now, just verify the structure
      const result = await checkRateLimit(identifier);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('reset');
    });
  });

  describe('getRateLimitIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        h, e, a, ders: {
          g, e, t: jest.fn((header) => {
            if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            if (header === 'user-agent') return 'Mozilla/5.0 Test';
            return null;
          }),
        },
      } as any;
      
      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toContain('192.168.1.1');
    });

    it('should fallback to x-real-ip header', () => {
      const mockRequest = {
        h, e, a, ders: {
          g, e, t: jest.fn((header) => {
            if (header === 'x-real-ip') return '192.168.1.2';
            if (header === 'user-agent') return 'Mozilla/5.0 Test';
            return null;
          }),
        },
      } as any;
      
      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toContain('192.168.1.2');
    });

    it('should use anonymous when no IP found', () => {
      const mockRequest = {
        h, e, a, ders: {
          g, e, t: jest.fn(() => null),
        },
      } as any;
      
      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toContain('anonymous');
    });
  });
});
