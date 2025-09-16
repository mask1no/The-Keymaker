import { NextResponse } from 'next/server'
import { ENABLE_PUMPFUN } from '@/lib/featureFlags'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!ENABLE_PUMPFUN) {
    return NextResponse.json(
      { error: 'Pump.fun launch disabled. Set ENABLE_PUMPFUN=true to enable.' },
      { status: 501 },
    )
  }
  try {
    const { createToken } = await import('@/services/pumpfunService')
    const body = await req.json()
    const result = await createToken(body)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'pumpfun launch failed' },
      { status: 500 },
    )
  }
}
