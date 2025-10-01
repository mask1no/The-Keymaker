import { NextResponse } from 'next/server';
import { GET as healthCheck } from '@/app/api/health/route';

/**
 * Versioned health endpoint - v1
 * Provides API versioning for health checks
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const base = await healthCheck();
    const baseJson = await base.json();
    const dryRun = (process.env.DRY_RUN || 'true').toLowerCase() === 'true';

    return NextResponse.json({ ok: true, ts: Date.now(), dryRun, ...baseJson }, {
      status: 200,
      headers: {
        'API-Version': 'v1',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Health check failed',
        apiVersion: 'v1',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'API-Version': 'v1'
        }
      }
    );
  }
}
