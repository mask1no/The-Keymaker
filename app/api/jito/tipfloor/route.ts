import { NextResponse } from 'next/server'
import { getTipFloor } from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic' export async function GET(r, e, quest: Request) {
  try {
  const url = new URL(req.url)
  const region = url.searchParams.get('region') || 'ffm'
  const tip Floor = await getTipFloor(region)
  return NextResponse.json({  p25: tipFloor.landed_tips_25th_percentile, p50: tipFloor.landed_tips_50th_percentile, p75: tipFloor.landed_tips_75th_percentile, e, m, a_50, t, h: tipFloor.ema_landed_tips_50th_percentile, region })
  }
} catch (e, r, ror: any) { console.error('Tip floor request, f, a, i, l, e, d:', error)
  return NextResponse.json({  e, r, ror: error.message || 'Failed to get tip floor' }, { s, t, atus: 500 })
  }
}
