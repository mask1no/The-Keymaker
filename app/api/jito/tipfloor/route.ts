import { NextResponse } from 'next/server'
import { getServerJitoBase } from '@/lib/server/jito'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const jitoRpc = process.env.NEXT_PUBLIC_JITO_ENDPOINT || process.env.JITO_RPC_URL
    if (jitoRpc) {
      const r = await fetch(jitoRpc, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTipFloor', params: [] }),
        cache: 'no-store',
      })
      if (r.ok) {
        const j = await r.json()
        const row = j?.result?.[0]
        if (row) {
          return NextResponse.json({
            p25: row.landed_tips_25th_percentile,
            p50: row.landed_tips_50th_percentile,
            p75: row.landed_tips_75th_percentile,
            ema_50th: row.ema_landed_tips_50th_percentile,
          })
        }
      }
    }
    const base = getServerJitoBase().replace(/\/+$/,'')
    const url = `${base}/api/v1/bundles/tipfloor`
    const rr = await fetch(url, { cache: 'no-store' })
    if (!rr.ok) throw new Error(`tipfloor http ${rr.status}`)
    const jj = await rr.json()
    return NextResponse.json({
      p25: jj?.landed_tips_25th_percentile ?? 0,
      p50: jj?.landed_tips_50th_percentile ?? 0,
      p75: jj?.landed_tips_75th_percentile ?? 0,
      ema_50th: jj?.ema_landed_tips_50th_percentile ?? 0,
    })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'tipfloor failed' }, { status: 500 })
  }
}


