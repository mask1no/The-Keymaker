import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, symbol, supply, metadata } = body || {}

    if (!name || !symbol || !supply) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const svc = await import('@/services/pumpfunService')
    const mint = await svc.createToken(
      name,
      symbol,
      Number(supply),
      metadata || {},
    )

    return NextResponse.json({ mint }, { status: 200 })
  } catch (error: any) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: error?.message || 'Pump.fun launch failed' },
      { status: 500 },
    )
  }
}
