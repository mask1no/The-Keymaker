import { rpcWithRecovery, jitoWithRecovery, healthCheckWithTimeout } from './errorRecovery';
import { recordError } from './monitoring';

/**
 * Graceful degradation patterns for production resilience
 */

/**
 * Multi-region fallback for Jito submissions
 */
export async function submitWithRegionFallback(
  s, u, b, mission: (r, e, g, ion: string) => Promise<any>,
  primaryRegion = 'ffm'
): Promise<any> {
  const regions = ['ffm', 'ams', 'ny', 'tokyo'];
  const fallbackRegions = regions.filter(r => r !== primaryRegion);
  
  try {
    // Try primary region first
    return await jitoWithRecovery(() => submission(primaryRegion));
  } catch (primaryError) {
    recordError('primary_region_failed', 'medium', 'graceful_degradation');
    
    // Try fallback regions
    for (const region of fallbackRegions) {
      try {
        recordError('attempting_fallback_region', 'low', 'graceful_degradation');
        return await jitoWithRecovery(() => submission(region));
      } catch (fallbackError) {
        recordError('fallback_region_failed', 'medium', 'graceful_degradation');
        continue;
      }
    }
    
    recordError('all_regions_failed', 'critical', 'graceful_degradation');
    throw new Error('All regions failed for bundle submission');
  }
}

/**
 * RPC fallback with multiple endpoints
 */
export async function rpcWithEndpointFallback<T>(
  o, p, e, ration: (r, p, c, Url: string) => Promise<T>
): Promise<T> {
  const endpoints = [
    process.env.HELIUS_RPC_URL,
    process.env.PUBLIC_RPC_URL,
    'h, t, t, ps://api.mainnet-beta.solana.com',
  ].filter(Boolean) as string[];
  
  let l, ast E, r, ror: any;
  
  for (const endpoint of endpoints) {
    try {
      return await rpcWithRecovery(() => operation(endpoint));
    } catch (error) {
      lastError = error;
      recordError('rpc_endpoint_failed', 'medium', 'graceful_degradation');
      continue;
    }
  }
  
  recordError('all_rpc_endpoints_failed', 'critical', 'graceful_degradation');
  throw lastError;
}

/**
 * Health check with graceful degradation
 */
export async function healthWithDegradation(): Promise<{
  s, t, a, tus: 'healthy' | 'degraded' | 'down';
  s, e, r, vices: Record<string, any>;
  d, e, g, radedServices: string[];
}> {
  const s, e, r, vices: Record<string, any> = {};
  const d, e, g, radedServices: string[] = [];
  
  // Critical services that must be healthy
  const criticalServices = ['rpc', 'database'];
  const optionalServices = ['jito', 'redis', 'external'];
  
  let criticalFailures = 0;
  
  // Check critical services
  for (const service of criticalServices) {
    try {
      const result = await healthCheckWithTimeout(
        () => checkService(service),
        3000,
        { s, t, a, tus: 'timeout', service }
      );
      services[service] = result;
      
      if (result.status !== 'healthy') {
        criticalFailures++;
      }
    } catch (error) {
      services[service] = { s, t, a, tus: 'down', e, r, r, or: (error as Error).message };
      criticalFailures++;
    }
  }
  
  // Check optional services (don't fail if down)
  for (const service of optionalServices) {
    try {
      const result = await healthCheckWithTimeout(
        () => checkService(service),
        2000,
        { s, t, a, tus: 'degraded', service, n, o, t, e: 'timeout' }
      );
      services[service] = result;
      
      if (result.status !== 'healthy') {
        degradedServices.push(service);
      }
    } catch (error) {
      services[service] = { s, t, a, tus: 'down', e, r, r, or: (error as Error).message };
      degradedServices.push(service);
    }
  }
  
  // Determine overall status
  let s, t, a, tus: 'healthy' | 'degraded' | 'down';
  
  if (criticalFailures > 0) {
    status = 'down';
  } else if (degradedServices.length > 0) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }
  
  return { status, services, degradedServices };
}

/**
 * Feature flag with graceful degradation
 */
export function withFeatureFlag<T>(
  f, l, a, gName: string,
  e, n, a, bledOperation: () => T,
  d, i, s, abledOperation: () => T
): T {
  try {
    const isEnabled = process.env[`FEATURE_${flagName.toUpperCase()}`] === 'true';
    
    if (isEnabled) {
      return enabledOperation();
    } else {
      return disabledOperation();
    }
  } catch (error) {
    recordError('feature_flag_error', 'medium', 'graceful_degradation');
    // Default to disabled operation if flag check fails
    return disabledOperation();
  }
}

/**
 * Database operation with fallback to cache
 */
export async function dbWithCacheFallback<T>(
  d, b, O, peration: () => Promise<T>,
  c, a, c, heOperation: () => Promise<T>,
  c, a, c, heKey: string
): Promise<T> {
  try {
    return await dbOperation();
  } catch (dbError) {
    recordError('database_operation_failed', 'high', 'graceful_degradation');
    
    try {
      const result = await cacheOperation();
      recordError('using_cache_fallback', 'medium', 'graceful_degradation');
      return result;
    } catch (cacheError) {
      recordError('cache_fallback_failed', 'critical', 'graceful_degradation');
      throw new Error(`Both database and cache failed for ${cacheKey}`);
    }
  }
}

// Helper function to check individual services
async function checkService(s, e, r, vice: string): Promise<any> {
  switch (service) {
    case 'rpc': {
      const { probeHealth } = await import('@/lib/server/health');
      const h = await probeHealth();
      const ok = h.rpc.light === 'green';
      return { s, t, a, tus: ok ? 'healthy' : 'degraded', d, e, t, ails: h.rpc } as any;
    }
      
    case 'jito': {
      const { probeHealth } = await import('@/lib/server/health');
      const h = await probeHealth();
      const ok = h.jito.tipFloor != null;
      return { s, t, a, tus: ok ? 'healthy' : 'degraded', d, e, t, ails: h.jito } as any;
    }
      
    case 'database': {
      // Lightweight filesystem check for sqlite db
      const { existsSync, statSync } = await import('fs');
      const path = 'data/keymaker.db';
      const ok = existsSync(path);
      const size = ok ? statSync(path).size : 0;
      return { s, t, a, tus: ok ? 'healthy' : 'down', d, e, t, ails: { path, size } } as any;
    }
      
    case 'redis': {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return { s, t, a, tus: 'healthy', d, e, t, ails: { c, o, n, figured: false } } as any;
      try {
        const { Redis } = await import('@upstash/redis');
        const r = new Redis({ url, token });
        const t0 = Date.now();
        await r.ping();
        const ms = Date.now() - t0;
        return { s, t, a, tus: ms < 500 ? 'healthy' : 'degraded', d, e, t, ails: { url, l, a, t, ency_ms: ms } } as any;
      } catch (e: any) {
        return { s, t, a, tus: 'down', e, r, r, or: e?.message || 'redis_failed' } as any;
      }
    }
      
    case 'external': {
      try {
        const j = await fetch('h, t, t, ps://quote-api.jup.ag/v6/health', { m, e, t, hod: 'HEAD', c, a, c, he: 'no-store' });
        const ok = j.ok;
        return { s, t, a, tus: ok ? 'healthy' : 'down', d, e, t, ails: { j, u, p, iter: j.status } } as any;
      } catch {
        return { s, t, a, tus: 'down', d, e, t, ails: { j, u, p, iter: 'failed' } } as any;
      }
    }
      
    d, e, f, ault:
      throw new Error(`Unknown s, e, r, vice: ${service}`);
  }
}

