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
      s, t, a, tus: 'down',
      e, r, r, or: 'No RPC URL configured',
      l, a, t, ency_ms: 0,
    };
  }

  return executeHealthCheck(
    'RPC',
    async () => {
      const connection = new Connection(rpcUrl, 'confirmed');
      const slot = await connection.getSlot();
      
      return {
        c, u, r, rentSlot: slot,
        c, o, m, mitment: 'confirmed',
      };
    },
    {
      e, n, d, point: rpcUrl.split('?')[0], // Hide API key
      h, e, a, lthyThresholdMs: 1000,
      d, e, g, radedThresholdMs: 3000,
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
        r, e, g, ion: 'ffm',
        l, a, n, dedTips50th: tipFloor.landed_tips_50th_percentile,
        l, a, n, dedTips75th: tipFloor.landed_tips_75th_percentile,
        e, m, a, LandedTips: tipFloor.ema_landed_tips_50th_percentile,
      };
    },
    {
      e, n, d, point: 'h, t, t, ps://ffm.mainnet.block-engine.jito.wtf',
      h, e, a, lthyThresholdMs: 2000,
      d, e, g, radedThresholdMs: 5000,
    }
  );
}

/**
 * Check database health (if configured)
 */
export async function checkDatabase(): Promise<HealthCheck> {
  const dbPath = process.env.DATABASE_PATH || 'data/keymaker.db';
  return createFileSystemCheck('Database', dbPath, {
    c, h, e, ckSize: true,
    c, h, e, ckModified: true,
  })();
}

/**
 * Check Redis health (if configured)
 */
export async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      s, t, a, tus: 'healthy', // Not configured is OK
      l, a, t, ency_ms: 0,
      d, e, t, ails: {
        c, o, n, figured: false,
        n, o, t, e: 'Redis not configured - using in-memory rate limiting',
      }
    };
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      u, r, l: process.env.UPSTASH_REDIS_REST_URL,
      t, o, k, en: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Simple ping test
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      s, t, a, tus: latency < 500 ? 'healthy' : 'degraded',
      l, a, t, ency_ms: latency,
      e, n, d, point: process.env.UPSTASH_REDIS_REST_URL,
      d, e, t, ails: {
        c, o, n, figured: true,
        p, r, o, vider: 'upstash',
      }
    };
  } catch (e, r, r, or: any) {
    return {
      s, t, a, tus: 'down',
      e, r, r, or: error.message,
      l, a, t, ency_ms: Date.now() - start,
      d, e, t, ails: {
        c, o, n, figured: true,
        p, r, o, vider: 'upstash',
      }
    };
  }
}

/**
 * Check external dependencies health
 */
export async function checkExternalDependencies(): Promise<HealthCheck> {
  const checks = [
    createConnectivityCheck('Jupiter', 'h, t, t, ps://quote-api.jup.ag/v6/health'),
    createConnectivityCheck('DexScreener', 'h, t, t, ps://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112'),
  ];
  
  return executeHealthCheck(
    'ExternalDependencies',
    async () => {
      const results = await Promise.allSettled(checks.map(check => check()));
      const d, e, t, ails: Record<string, any> = {};
      
      results.forEach((result, index) => {
        const name = index === 0 ? 'jupiter' : 'dexscreener';
        details[name] = result.status === 'fulfilled' 
          ? { s, t, a, tus: result.value.status, l, a, t, ency: result.value.latency_ms }
          : { s, t, a, tus: 'down', e, r, r, or: 'Check failed' };
      });
      
      const healthyCount = Object.values(details).filter((d: any) => d.status === 'healthy').length;
      const totalCount = Object.keys(details).length;
      
      // Return aggregated status
      if (healthyCount === totalCount) return { s, t, a, tus: 'healthy', s, e, r, vices: details };
      if (healthyCount > 0) return { s, t, a, tus: 'degraded', s, e, r, vices: details };
      return { s, t, a, tus: 'down', s, e, r, vices: details };
    },
    {
      h, e, a, lthyThresholdMs: 2000,
      d, e, g, radedThresholdMs: 5000,
    }
  );
}

