import { Connection } from '@solana/web3.js';
import { getTipFloor } from '@/lib/core/src/jito';
import { 
  executeHealthCheck, 
  createConnectivityCheck, 
  createFileSystemCheck,
  type HealthCheck 
} from './baseCheck';

/**
 * Check RPC connection health
 */
export async function checkRPC(): Promise<HealthCheck> {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.PUBLIC_RPC_URL;
  
  if (!rpcUrl) {
    return {
      status: 'down',
      error: 'No RPC URL configured',
      latency_ms: 0,
    };
  }

  return executeHealthCheck(
    'RPC',
    async () => {
      const connection = new Connection(rpcUrl, 'confirmed');
      const slot = await connection.getSlot();
      
      return {
        currentSlot: slot,
        commitment: 'confirmed',
      };
    },
    {
      endpoint: rpcUrl.split('?')[0], // Hide API key
      healthyThresholdMs: 1000,
      degradedThresholdMs: 3000,
    }
  );
}

/**
 * Check Jito Block Engine health
 */
export async function checkJito(): Promise<HealthCheck> {
  return executeHealthCheck(
    'Jito',
    async () => {
      const tipFloor = await getTipFloor('ffm');
      
      return {
        region: 'ffm',
        landedTips50th: tipFloor.landed_tips_50th_percentile,
        landedTips75th: tipFloor.landed_tips_75th_percentile,
        emaLandedTips: tipFloor.ema_landed_tips_50th_percentile,
      };
    },
    {
      endpoint: 'https://ffm.mainnet.block-engine.jito.wtf',
      healthyThresholdMs: 2000,
      degradedThresholdMs: 5000,
    }
  );
}

/**
 * Check database health (if configured)
 */
export async function checkDatabase(): Promise<HealthCheck> {
  const dbPath = process.env.DATABASE_PATH || 'data/keymaker.db';
  return createFileSystemCheck('Database', dbPath, {
    checkSize: true,
    checkModified: true,
  })();
}

/**
 * Check Redis health (if configured)
 */
export async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      status: 'healthy', // Not configured is OK
      latency_ms: 0,
      details: {
        configured: false,
        note: 'Redis not configured - using in-memory rate limiting',
      }
    };
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Simple ping test
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      status: latency < 500 ? 'healthy' : 'degraded',
      latency_ms: latency,
      endpoint: process.env.UPSTASH_REDIS_REST_URL,
      details: {
        configured: true,
        provider: 'upstash',
      }
    };
  } catch (error: any) {
    return {
      status: 'down',
      error: error.message,
      latency_ms: Date.now() - start,
      details: {
        configured: true,
        provider: 'upstash',
      }
    };
  }
}

/**
 * Check external dependencies health
 */
export async function checkExternalDependencies(): Promise<HealthCheck> {
  const checks = [
    createConnectivityCheck('Jupiter', 'https://quote-api.jup.ag/v6/health'),
    createConnectivityCheck('DexScreener', 'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112'),
  ];
  
  return executeHealthCheck(
    'ExternalDependencies',
    async () => {
      const results = await Promise.allSettled(checks.map(check => check()));
      const details: Record<string, any> = {};
      
      results.forEach((result, index) => {
        const name = index === 0 ? 'jupiter' : 'dexscreener';
        details[name] = result.status === 'fulfilled' 
          ? { status: result.value.status, latency: result.value.latency_ms }
          : { status: 'down', error: 'Check failed' };
      });
      
      const healthyCount = Object.values(details).filter((d: any) => d.status === 'healthy').length;
      const totalCount = Object.keys(details).length;
      
      // Return aggregated status
      if (healthyCount === totalCount) return { status: 'healthy', services: details };
      if (healthyCount > 0) return { status: 'degraded', services: details };
      return { status: 'down', services: details };
    },
    {
      healthyThresholdMs: 2000,
      degradedThresholdMs: 5000,
    }
  );
}
