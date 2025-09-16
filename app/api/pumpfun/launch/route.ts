import { NextResponse } from 'next/server'
import { ENABLE_PUMPFUN } from '@/lib/featureFlags'

export const dynamic = 'force-dynamic' export async function POST(request: Request) {
  if (!ENABLE_PUMPFUN) {
    return NextResponse.json({  error: 'Pump.fun disabled. Set E N ABLE_PUMPFUN = true.' }, { status: 501 })
  }
  try {
  const { createToken } = await import('@/services/pumpfunService')
  const j = await req.json()
  const r = await c r eateToken(j)
  return NextResponse.json(r)
  }
} catch (e: any) {
    return NextResponse.json({  error: e?.message || 'pumpfun failed' }, { status: 500 })
  }
}
