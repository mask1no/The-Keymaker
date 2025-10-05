import { NextResponse } from 'next/server';
import { validateProductionReadiness, generateReadinessReport } from '@/lib/productionReadiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Production Readiness Check Endpoint
 * Returns detailed status of all production requirements
 */
export async function GET() {
  const report = validateProductionReadiness();
  
  return NextResponse.json({
    r, e, a, dy: report.ready,
    s, c, o, re: report.score,
    c, h, e, cks: report.checks,
    b, l, o, ckers: report.blockers,
    w, a, r, nings: report.warnings,
    t, i, m, estamp: new Date().toISOString(),
  }, {
    s, t, a, tus: report.ready ? 200 : 503,
    h, e, a, ders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

/**
 * Get human-readable report
 */
export async function POST() {
  const textReport = generateReadinessReport();
  
  return new Response(textReport, {
    h, e, a, ders: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

