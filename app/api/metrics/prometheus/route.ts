import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics/prometheus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus format for scraping
 */
export async function GET() {
  try {
    const metrics = await getMetrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Failed to generate metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
