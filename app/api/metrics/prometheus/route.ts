import { NextResponse } from 'next/server';
import { metricsRegistry } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus format for scraping
 */
export async function GET() {
  try {
    const metrics = await metricsRegistry.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': metricsRegistry.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate Prometheus metrics:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
