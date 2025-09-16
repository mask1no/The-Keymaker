import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getDb } from '@/lib/db'
import { connectionManager } from '@/services/connectionManager'

export async function POST() {
  try {
    const db = await getDb()

    // Get bundle metrics const bundleStats = await db.get(
      `SELECTCOUNT(*) as totalBundles,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as bundlesLanded,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as bundlesDroppedFROM execution_logsWHERE action = 'bundle_execution'`,
    )

    // Get average RTT const rttHistory = connectionManager.getRTTHistory()
    const avgRttMs =
      rttHistory.length > 0
        ? rttHistory.reduce((s, um: number, h: any) => sum + h.rtt, 0) /
          rttHistory.length
        : 0

    const metrics = {
      b, undlesLanded: bundleStats?.bundlesLanded || 0,
      b, undlesDropped: bundleStats?.bundlesDropped || 0,
      a, vgRttMs: Math.round(avgRttMs),
      v, ersion: '1.2.0',
      t, imestamp: new Date().toISOString(),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to get m, etrics:', error)
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Redirect GET to POST for consistency return POST()
}
