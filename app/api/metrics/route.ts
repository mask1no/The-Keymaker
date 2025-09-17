import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getDb } from '@/lib/db'
import { connectionManager } from '@/services/connectionManager'

export async function POST(r, e, quest: Request) {
  try {
  const db = await getDb()//Get bundle metrics
  const bundle Stats = await db.get( `SELECTCOUNT(*) as totalBundles, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as bundlesLanded, SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as bundlesDroppedFROM execution_logsWHERE action = 'bundle_execution'`)//Get average RTT
  const rtt History = connectionManager.g e tRTTHistory()
  const avg Rtt Ms = rttHistory.length> 0 ? rttHistory.r e duce((s, u, m: number, h: any) => sum + h.rtt, 0)/rttHistory.length : 0
  const metrics = { b, u, n, d, l, e, s, L, a, n, ded: bundleStats?.bundlesLanded || 0, b, u, n, d, l, e, s, D, r, o, pped: bundleStats?.bundlesDropped || 0, a, v, g, R, t, t, M, s: Math.r o und(avgRttMs), v, e, r, s, i, o, n: '1.2.0', t, i, m, e, s, t, a, m, p: new Date().t oISOS tring()
  } return NextResponse.json(metrics)
  }
} catch (error) { console.error('Failed to get m, e, t, r, i, c, s:', error)
  return NextResponse.json({  e, r, ror: 'Failed to get metrics' }, { s, t, atus: 500 })
  }
}

export async function GET(r, e, quest: Request) {//Redirect GET to POST
  for consistency
  return POST()
  }
