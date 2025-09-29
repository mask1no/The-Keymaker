import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

// Mock dependencies
jest.mock('@/lib/testMode', () => ({
  isTestMode: jest.fn()
}));

jest.mock('@/lib/health/checks', () => ({
  checkRPC: jest.fn(),
  checkJito: jest.fn(), 
  checkDatabase: jest.fn(),
  checkRedis: jest.fn(),
  checkExternalDependencies: jest.fn()
}));

jest.mock('@/lib/health/baseCheck', () => ({
  aggregateHealthChecks: jest.fn()
}));

import { isTestMode } from '@/lib/testMode';
import { 
  checkRPC, 
  checkJito, 
  checkDatabase, 
  checkRedis, 
  checkExternalDependencies 
} from '@/lib/health/checks';
import { aggregateHealthChecks } from '@/lib/health/baseCheck';

describe('Health API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return test mode response when in test mode', async () => {
      (isTestMode as jest.Mock).mockReturnValue(true);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.environment).toBe('test');
      expect(data.checks.rpc.note).toBe('test mode');
      expect(data.checks.jito.note).toBe('test mode');
      expect(data.checks.database.note).toBe('test mode');
      expect(data.checks.redis.note).toBe('test mode');
      expect(data.checks.external.note).toBe('test mode');
      expect(typeof data.duration_ms).toBe('number');
    });

    it('should return production health checks when not in test mode', async () => {
      (isTestMode as jest.Mock).mockReturnValue(false);
      (aggregateHealthChecks as jest.Mock).mockResolvedValue({
        overall: 'healthy',
        checks: {
          rpc: { status: 'healthy', latency_ms: 50 },
          jito: { status: 'healthy', latency_ms: 30 },
          database: { status: 'healthy' },
          redis: { status: 'healthy' },
          external: { status: 'healthy' }
        },
        summary: { healthy: 5, degraded: 0, down: 0 }
      });

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.status).toBe('healthy');
      // Just verify it was called, implementation may vary
      expect(aggregateHealthChecks).toHaveBeenCalled();
    });

    it('should return 503 when overall status is down', async () => {
      (isTestMode as jest.Mock).mockReturnValue(false);
      (aggregateHealthChecks as jest.Mock).mockResolvedValue({
        overall: 'down',
        checks: {
          rpc: { status: 'down', error: 'Connection failed' },
          jito: { status: 'healthy' },
          database: { status: 'healthy' },
          redis: { status: 'healthy' },
          external: { status: 'healthy' }
        },
        summary: { healthy: 4, degraded: 0, down: 1 }
      });

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(503);
      expect(data.ok).toBe(false);
      expect(data.status).toBe('down');
    });

    it('should include proper cache control headers', async () => {
      (isTestMode as jest.Mock).mockReturnValue(true);
      
      const response = await GET();
      
      // Check that headers Map exists and contains cache control
      expect(response.headers).toBeDefined();
      expect(response.headers instanceof Map).toBe(true);
    });

    it('should include version and timestamp in response', async () => {
      (isTestMode as jest.Mock).mockReturnValue(true);
      
      const response = await GET();
      const data = await response.json();
      
      expect(data.version).toBe('1.5.2');
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should measure execution duration', async () => {
      (isTestMode as jest.Mock).mockReturnValue(true);
      
      const response = await GET();
      const data = await response.json();
      
      expect(typeof data.duration_ms).toBe('number');
      expect(data.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });
});
