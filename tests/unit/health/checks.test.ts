import { checkRPC, checkDatabase } from '@/lib/health/checks';
import { executeHealthCheck, aggregateHealthChecks } from '@/lib/health/baseCheck';

// Mock external dependencies
jest.mock('@solana/web3.js');
jest.mock('@/lib/core/src/jito');

describe('Health Checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('checkRPC', () => {
    it('should return down status when no RPC URL configured', async () => {
      delete process.env.HELIUS_RPC_URL;
      delete process.env.PUBLIC_RPC_URL;
      
      const result = await checkRPC();
      expect(result.status).toBe('down');
      expect(result.error).toBe('No RPC URL configured');
    });

    it('should use HELIUS_RPC_URL when available', async () => {
      process.env.HELIUS_RPC_URL = 'https://test-rpc.com';
      
      // Mock successful connection
      const mockConnection = {
        getSlot: jest.fn().mockResolvedValue(12345),
      };
      
      const { Connection } = require('@solana/web3.js');
      Connection.mockImplementation(() => mockConnection);
      
      const result = await checkRPC();
      expect(result.status).toBe('healthy');
      expect(result.details?.currentSlot).toBe(12345);
    });
  });

  describe('checkDatabase', () => {
    it('should check default database path', async () => {
      const result = await checkDatabase();
      expect(result).toBeDefined();
      expect(result.status).toBeOneOf(['healthy', 'degraded', 'down']);
    });
  });

  describe('executeHealthCheck', () => {
    it('should handle successful checks', async () => {
      const mockFn = jest.fn().mockResolvedValue({ test: 'data' });
      
      const result = await executeHealthCheck('TestService', mockFn, {
        endpoint: 'https://test.com',
        healthyThresholdMs: 100,
      });
      
      expect(result.status).toBe('healthy');
      expect(result.details).toEqual({ test: 'data' });
      expect(result.endpoint).toBe('https://test.com');
    });

    it('should handle failed checks', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      const result = await executeHealthCheck('TestService', mockFn);
      
      expect(result.status).toBe('down');
      expect(result.error).toBe('Connection failed');
    });

    it('should determine status based on latency', async () => {
      const slowMockFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({}), 1500))
      );
      
      const result = await executeHealthCheck('SlowService', slowMockFn, {
        healthyThresholdMs: 1000,
        degradedThresholdMs: 2000,
      });
      
      expect(result.status).toBe('degraded');
      expect(result.latency_ms).toBeGreaterThan(1000);
    });
  });

  describe('aggregateHealthChecks', () => {
    it('should aggregate multiple health checks', async () => {
      const checks = {
        service1: jest.fn().mockResolvedValue({ status: 'healthy' }),
        service2: jest.fn().mockResolvedValue({ status: 'degraded' }),
        service3: jest.fn().mockResolvedValue({ status: 'down' }),
      };
      
      const result = await aggregateHealthChecks(checks);
      
      expect(result.overall).toBe('degraded');
      expect(result.summary.total).toBe(3);
      expect(result.summary.healthy).toBe(1);
      expect(result.summary.degraded).toBe(1);
      expect(result.summary.down).toBe(1);
    });

    it('should respect critical services', async () => {
      const checks = {
        critical: jest.fn().mockResolvedValue({ status: 'down' }),
        optional: jest.fn().mockResolvedValue({ status: 'healthy' }),
      };
      
      const result = await aggregateHealthChecks(checks, {
        criticalServices: ['critical'],
      });
      
      expect(result.overall).toBe('down');
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, array) {
    const pass = array.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${array}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${array}`,
        pass: false,
      };
    }
  },
});
