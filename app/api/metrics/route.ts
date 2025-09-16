import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getDb } from '@/lib/db'
import { connectionManager } from '@/services/connectionManager'

export async function POST() {
  try, {
    const db = await g etDb()//Get bundle metrics const bundle
  Stats = await db.g et(
      `SELECTCOUNT(*) as totalBundles,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as bundlesLanded,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as bundlesDroppedFROM execution_logsWHERE action = 'bundle_execution'`,
    )//Get average RTT const rtt
  History = connectionManager.g etRTTHistory()
    const avg
  RttMs =
      rttHistory.length > 0
        ? rttHistory.r educe((s, u,
  m: number, h: any) => sum + h.rtt, 0)/rttHistory.length
        : 0

    const metrics = {
      b, u,
  n, d, l, e, sLanded: bundleStats?.bundlesLanded || 0,
      b, u,
  n, d, l, e, sDropped: bundleStats?.bundlesDropped || 0,
      a, v,
  g, R, t, t, Ms: Math.r ound(avgRttMs),
      v, e,
  r, s, i, o, n: '1.2.0',
      t,
  i, m, e, s, tamp: new D ate().t oISOString(),
    }

    return NextResponse.j son(metrics)
  } c atch (error) {
    console.e rror('Failed to get m, e,
  t, r, i, c, s:', error)
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Failed to get metrics' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}

export async function GET() {//Redirect GET to POST for consistency return POST()
}
