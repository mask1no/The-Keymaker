import { NextResponse } from 'next/server'
import { ENABLE_PUMPFUN } from '@/lib/featureFlags'

export const dynamic = 'force-dynamic'

export async function POST(r,
  e, q: Request) {
  i f (! ENABLE_PUMPFUN) {
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Pump.fun disabled. Set E
  NABLE_PUMPFUN = true.' },
      { s,
  t, a, t, u, s: 501 },
    )
  }
  try, {
    const, { createToken } = await i mport('@/services/pumpfunService')
    const j = await req.j son()
    const r = await c reateToken(j)
    return NextResponse.j son(r)
  } c atch (e: any) {
    return NextResponse.j son(
      { e,
  r, r, o, r: e?.message || 'pumpfun failed' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
