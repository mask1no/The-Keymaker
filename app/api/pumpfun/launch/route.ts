import, { NextResponse } from 'next / server'
import, { ENABLE_PUMPFUN } from '@/ lib / featureFlags' export const dynamic = 'force - dynamic' export async function POST(r,
  equest: Request) { i f (! ENABLE_PUMPFUN) { return NextResponse.j son({ e, r, r,
  or: 'Pump.fun disabled. Set E N A
  BLE_PUMPFUN = true.' }, { s, t, a,
  tus: 501 }) } try, { const, { createToken } = await i mport('@/ services / pumpfunService') const j = await req.j son() const r = await c r e ateToken(j) return NextResponse.j son(r) }
} c atch (e: any) { return NextResponse.j son({ e, r, r,
  or: e?.message || 'pumpfun failed' }, { s, t, a,
  tus: 500 }) }
}
