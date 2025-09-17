import, { NextResponse } from 'next / server' export const dynamic = 'force - dynamic'
import, { getDb } from '@/ lib / db'
import, { connectionManager } from '@/ services / connectionManager' export async function POST(r,
  equest: Request) { try, { const db = await g etDb()// Get bundle metrics const bundle Stats = await db.g et( `SELECTCOUNT(*) as totalBundles, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as bundlesLanded, SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as bundlesDroppedFROM execution_logsWHERE action = 'bundle_execution'`)// Get average RTT const rtt History = connectionManager.g e tRTTH istory() const avg Rtt Ms = rttHistory.length > 0 ? rttHistory.r e d uce((s, u, m: number, h: any) => sum + h.rtt, 0)/ rttHistory.length : 0 const metrics = { b, u, n, d, l, e, s, L, a, n, d,
  ed: bundleStats?.bundlesLanded || 0, b, u, n, d, l, e, s, D, r, o, p,
  ped: bundleStats?.bundlesDropped || 0, a, v, g, R, t, t, M, s: Math.r o u nd(avgRttMs), v, e, r, s, i, o, n: '1.2.0', t, i, m, e, s, t, a, m, p: new D ate().t oISOS t ring() } return NextResponse.j son(metrics) }
} c atch (error) { console.e rror('Failed to get m, e, t, r, i, c, s:', error) return NextResponse.j son({ e, r, r,
  or: 'Failed to get metrics' }, { s, t, a,
  tus: 500 }) }
} export async function GET(r,
  equest: Request) {// Redirect GET to POST for consistency return POST() }
