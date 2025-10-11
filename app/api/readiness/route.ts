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

  return NextResponse.json(
    {
      ready: report.ready,
      score: report.score,
      checks: report.checks,
      blockers: report.blockers,
      warnings: report.warnings,
      timestamp: new Date().toISOString(),
    },
    {
      status: report.ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

/**
 * Get human-readable report
 */
export async function POST() {
  const textReport = generateReadinessReport();

  return new Response(textReport, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
