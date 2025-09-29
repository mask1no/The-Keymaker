import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';
import { 
  checkRPC, 
  checkJito, 
  checkDatabase, 
  checkRedis, 
  checkExternalDependencies 
} from '@/lib/health/checks';
import { aggregateHealthChecks } from '@/lib/health/baseCheck';
import { isTestMode } from '@/lib/testMode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();

  // In test mode, return mock data for faster tests
  if (isTestMode()) {
    return NextResponse.json({
      ok: true,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      environment: 'test',
      checks: {
        rpc: { status: 'healthy', latency_ms: 10, note: 'test mode' },
        jito: { status: 'healthy', latency_ms: 5, region: 'ffm', note: 'test mode' },
        database: { status: 'healthy', note: 'test mode' },
        redis: { status: 'healthy', note: 'test mode' },
        external: { status: 'healthy', note: 'test mode' },
      },
      duration_ms: Date.now() - started,
    });
  }

  // Run all health checks using aggregation system
  const healthResult = await aggregateHealthChecks(
    {
      rpc: checkRPC,
      jito: checkJito,
      database: checkDatabase,
      redis: checkRedis,
      external: checkExternalDependencies,
    },
    {
      criticalServices: ['rpc', 'jito'], // These must be healthy
      parallel: true,
    }
  );

  const response = {
    ok: healthResult.overall !== 'down',
    status: healthResult.overall,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: healthResult.checks,
    duration_ms: Date.now() - started,
    summary: healthResult.summary,
  };

  // Return appropriate HTTP status
  const httpStatus = healthResult.overall === 'down' ? 503 : 200;
  
  return NextResponse.json(response, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}