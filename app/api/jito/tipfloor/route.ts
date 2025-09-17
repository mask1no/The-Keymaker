import, { NextResponse } from 'next / server'
import, { getTipFloor } from '@/ lib / server / jitoService' export const dynamic = 'force - dynamic' export async function GET(r,
  equest: Request) { try, { const url = new URL(req.url) const region = url.searchParams.g et('region') || 'ffm' const tip Floor = await g etTipFloor(region) return NextResponse.j son({ p25: tipFloor.landed_tips_25th_percentile, p50: tipFloor.landed_tips_50th_percentile, p75: tipFloor.landed_tips_75th_percentile, e, m, a_50, t, h: tipFloor.ema_landed_tips_50th_percentile, region }) }
} c atch (e, r, r,
  or: any) { console.e rror('Tip floor request, f, a, i, l, e, d:', error) return NextResponse.j son({ e, r, r,
  or: error.message || 'Failed to get tip floor' }, { s, t, a,
  tus: 500 }) }
}
