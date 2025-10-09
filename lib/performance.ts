import 'server-only';

// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  timestamp: number;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000;

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(limit = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const totalDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / relevantMetrics.length;
  }

  getErrorRate(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const errorCount = relevantMetrics.filter((m) => m.statusCode >= 400).length;
    return errorCount / relevantMetrics.length;
  }

  getSlowestEndpoints(limit = 10): Array<{ endpoint: string; avgDuration: number }> {
    const endpointStats = new Map<string, { totalDuration: number; count: number }>();

    this.metrics.forEach((metric) => {
      const existing = endpointStats.get(metric.endpoint) || { totalDuration: 0, count: 0 };
      existing.totalDuration += metric.duration;
      existing.count += 1;
      endpointStats.set(metric.endpoint, existing);
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Database query optimization
export class QueryOptimizer {
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 60000; // 1 minute

  async executeWithCache<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    const cached = this.queryCache.get(queryKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.result;
    }

    const result = await queryFn();
    this.queryCache.set(queryKey, {
      result,
      timestamp: now,
      ttl,
    });

    return result;
  }

  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  getCacheStats() {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
    };
  }
}

export const queryOptimizer = new QueryOptimizer();

// Memory optimization utilities
export function optimizeMemoryUsage() {
  if (global.gc) {
    global.gc();
  }
}

export function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

export async function isMemoryPressureHigh(): Promise<boolean> {
  const usage = getMemoryUsage();
  const totalMemory = (await import('os')).totalmem();
  const memoryUsagePercent = (usage.heapUsed / totalMemory) * 100;

  return memoryUsagePercent > 80; // Alert if using more than 80% of system memory
}

// Response compression utilities
export function shouldCompressResponse(contentType: string, size: number): boolean {
  const compressibleTypes = [
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
  ];

  return compressibleTypes.some((type) => contentType.includes(type)) && size > 1024;
}

// Connection pooling for database
export class ConnectionPool {
  private connections: any[] = [];
  private readonly maxConnections = 10;
  private readonly minConnections = 2;

  async getConnection(): Promise<any> {
    if (this.connections.length > 0) {
      return this.connections.pop();
    }

    // Create new connection if under limit
    if (this.connections.length < this.maxConnections) {
      // This would be implemented based on your database client
      return null;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.connections.length > 0) {
          resolve(this.connections.pop());
        } else {
          setTimeout(checkConnection, 10);
        }
      };
      checkConnection();
    });
  }

  releaseConnection(connection: any) {
    if (this.connections.length < this.maxConnections) {
      this.connections.push(connection);
    }
  }
}

export const connectionPool = new ConnectionPool();

// Performance middleware for API routes
export function withPerformanceMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  endpoint: string,
) {
  return async (...args: T): Promise<R> => {
    const startTime = process.hrtime.bigint();
    const startMemory = getMemoryUsage();
    const startCpu = process.cpuUsage();

    try {
      const result = await handler(...args);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const endMemory = getMemoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      performanceMonitor.recordMetric({
        timestamp: Date.now(),
        endpoint,
        method: 'POST', // This would be determined from the request
        duration,
        statusCode: 200,
        memoryUsage: endMemory,
        cpuUsage: endCpu,
      });

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      const endMemory = getMemoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      performanceMonitor.recordMetric({
        timestamp: Date.now(),
        endpoint,
        method: 'POST',
        duration,
        statusCode: 500,
        memoryUsage: endMemory,
        cpuUsage: endCpu,
      });

      throw error;
    }
  };
}

// Cache management
export class CacheManager {
  private caches = new Map<string, Map<string, { value: any; expiry: number }>>();

  set(namespace: string, key: string, value: any, ttlMs = 60000) {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }

    const cache = this.caches.get(namespace)!;
    cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  get(namespace: string, key: string): any | null {
    const cache = this.caches.get(namespace);
    if (!cache) return null;

    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(namespace?: string) {
    if (namespace) {
      this.caches.delete(namespace);
    } else {
      this.caches.clear();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [namespace, cache] of this.caches) {
      for (const [key, entry] of cache) {
        if (now > entry.expiry) {
          cache.delete(key);
        }
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Cleanup expired cache entries every 5 minutes
setInterval(
  () => {
    cacheManager.cleanup();
  },
  5 * 60 * 1000,
);
