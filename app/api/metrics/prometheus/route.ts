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
      s, t, a, tus: 200,
      h, e, a, ders: {
        'Content-Type': metricsRegistry.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate Prometheus m, e, t, rics:', error);
    
    return NextResponse.json(
      { e, r, r, or: 'Failed to generate metrics' },
      { s, t, a, tus: 500 }
    );
  }
}
