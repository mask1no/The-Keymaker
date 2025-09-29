/**
 * Base health check utilities to eliminate duplication
 */

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms?: number;
  error?: string;
  endpoint?: string;
  details?: Record<string, any>;
}

/**
 * Standard health check wrapper with error handling
 */
export async function executeHealthCheck(
  name: string,
  checkFn: () => Promise<any>,
  options: {
    endpoint?: string;
    healthyThresholdMs?: number;
    degradedThresholdMs?: number;
  } = {}
): Promise<HealthCheck> {
  const {
    endpoint,
    healthyThresholdMs = 1000,
    degradedThresholdMs = 3000,
  } = options;
  
  const start = Date.now();
  
  try {
    const result = await checkFn();
    const latency = Date.now() - start;
    
    // Determine status based on latency
    const status = 
      latency <= healthyThresholdMs ? 'healthy' :
      latency <= degradedThresholdMs ? 'degraded' : 'down';
    
    return {
      status,
      latency_ms: latency,
      endpoint,
      details: typeof result === 'object' ? result : { result },
    };
  } catch (error: any) {
    return {
      status: 'down',
      error: error.message || String(error),
      latency_ms: Date.now() - start,
      endpoint,
    };
  }
}

/**
 * Create a simple connectivity health check
 */
export function createConnectivityCheck(
  name: string,
  url: string,
  options: {
    timeoutMs?: number;
    method?: 'GET' | 'HEAD' | 'POST';
    expectedStatus?: number[];
  } = {}
) {
  const {
    timeoutMs = 5000,
    method = 'HEAD',
    expectedStatus = [200, 201, 204],
  } = options;
  
  return () => executeHealthCheck(
    name,
    async () => {
      const response = await fetch(url, {
        method,
        signal: AbortSignal.timeout(timeoutMs),
      });
      
      if (!expectedStatus.includes(response.status)) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      
      return {
        status: response.status,
        statusText: response.statusText,
      };
    },
    {
      endpoint: url,
      healthyThresholdMs: 500,
      degradedThresholdMs: 2000,
    }
  );
}

/**
 * Create a file system health check
 */
export function createFileSystemCheck(
  name: string,
  filePath: string,
  options: {
    checkSize?: boolean;
    checkModified?: boolean;
  } = {}
) {
  const { checkSize = true, checkModified = true } = options;
  
  return () => executeHealthCheck(
    name,
    async () => {
      const { existsSync, statSync } = await import('fs');
      const { join } = await import('path');
      
      const fullPath = join(process.cwd(), filePath);
      
      if (!existsSync(fullPath)) {
        throw new Error('File not found');
      }
      
      const stats = statSync(fullPath);
      const details: Record<string, any> = {
        path: filePath,
        exists: true,
      };
      
      if (checkSize) {
        details.size = stats.size;
      }
      
      if (checkModified) {
        details.modified = stats.mtime.toISOString();
      }
      
      return details;
    },
    {
      endpoint: filePath,
      healthyThresholdMs: 100,
      degradedThresholdMs: 500,
    }
  );
}

/**
 * Create a database connection health check
 */
export function createDatabaseCheck(
  _name: string,
  connectionFn: () => Promise<any>,
  options: {
    testQuery?: string;
  } = {}
) {
  return () => executeHealthCheck(
    _name,
    async () => {
      const connection = await connectionFn();
      
      // If a test query is provided, execute it
      if (options.testQuery && typeof connection.query === 'function') {
        await connection.query(options.testQuery);
      }
      
      return {
        connected: true,
        testQuery: options.testQuery || null,
      };
    },
    {
      healthyThresholdMs: 200,
      degradedThresholdMs: 1000,
    }
  );
}

/**
 * Aggregate multiple health checks
 */
export async function aggregateHealthChecks(
  checks: Record<string, () => Promise<HealthCheck>>,
  options: {
    criticalServices?: string[];
    parallel?: boolean;
  } = {}
): Promise<{
  overall: 'healthy' | 'degraded' | 'down';
  checks: Record<string, HealthCheck>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}> {
  const { criticalServices = [], parallel = true } = options;
  
  let results: Record<string, HealthCheck>;
  
  if (parallel) {
    // Run all checks in parallel
    const entries = Object.entries(checks);
    const settled = await Promise.allSettled(
      entries.map(([name, checkFn]) => checkFn())
    );
    
    results = {};
    entries.forEach(([name], index) => {
      const result = settled[index];
      results[name] = result.status === 'fulfilled' 
        ? result.value 
        : { status: 'down', error: 'Check failed to execute' };
    });
  } else {
    // Run checks sequentially
    results = {};
    for (const [name, checkFn] of Object.entries(checks)) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = {
          status: 'down',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }
  
  // Calculate summary
  const summary = {
    total: Object.keys(results).length,
    healthy: Object.values(results).filter(r => r.status === 'healthy').length,
    degraded: Object.values(results).filter(r => r.status === 'degraded').length,
    down: Object.values(results).filter(r => r.status === 'down').length,
  };
  
  // Determine overall status
  const criticalDown = criticalServices.some(service => 
    results[service]?.status === 'down'
  );
  
  const overall = criticalDown ? 'down' :
    summary.down > 0 ? 'degraded' :
    summary.degraded > 0 ? 'degraded' : 'healthy';
  
  return {
    overall,
    checks: results,
    summary,
  };
}
