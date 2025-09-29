import { rpcWithRecovery, jitoWithRecovery, healthCheckWithTimeout } from './errorRecovery';
import { recordError } from './monitoring';

/**
 * Graceful degradation patterns for production resilience
 */

/**
 * Multi-region fallback for Jito submissions
 */
export async function submitWithRegionFallback(
  submission: (region: string) => Promise<any>,
  primaryRegion: string = 'ffm'
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
  operation: (rpcUrl: string) => Promise<T>
): Promise<T> {
  const endpoints = [
    process.env.HELIUS_RPC_URL,
    process.env.PUBLIC_RPC_URL,
    'https://api.mainnet-beta.solana.com',
  ].filter(Boolean) as string[];
  
  let lastError: any;
  
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
  status: 'healthy' | 'degraded' | 'down';
  services: Record<string, any>;
  degradedServices: string[];
}> {
  const services: Record<string, any> = {};
  const degradedServices: string[] = [];
  
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
        { status: 'timeout', service }
      );
      services[service] = result;
      
      if (result.status !== 'healthy') {
        criticalFailures++;
      }
    } catch (error) {
      services[service] = { status: 'down', error: (error as Error).message };
      criticalFailures++;
    }
  }
  
  // Check optional services (don't fail if down)
  for (const service of optionalServices) {
    try {
      const result = await healthCheckWithTimeout(
        () => checkService(service),
        2000,
        { status: 'degraded', service, note: 'timeout' }
      );
      services[service] = result;
      
      if (result.status !== 'healthy') {
        degradedServices.push(service);
      }
    } catch (error) {
      services[service] = { status: 'down', error: (error as Error).message };
      degradedServices.push(service);
    }
  }
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'down';
  
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
  flagName: string,
  enabledOperation: () => T,
  disabledOperation: () => T
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
  dbOperation: () => Promise<T>,
  cacheOperation: () => Promise<T>,
  cacheKey: string
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
async function checkService(service: string): Promise<any> {
  switch (service) {
    case 'rpc':
      // Import and check RPC
      const { checkRPC } = await import('@/lib/health/checks');
      return checkRPC();
      
    case 'jito':
      const { checkJito } = await import('@/lib/health/checks');
      return checkJito();
      
    case 'database':
      const { checkDatabase } = await import('@/lib/health/checks');
      return checkDatabase();
      
    case 'redis':
      const { checkRedis } = await import('@/lib/health/checks');
      return checkRedis();
      
    case 'external':
      const { checkExternalDependencies } = await import('@/lib/health/checks');
      return checkExternalDependencies();
      
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}
