import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createToken } from '@/services/pumpfunService'

export async function POST(req: Request) {
  const {
    name,
    symbol,
    supply,
    metadata,
  } = await req.json()

  if (!name || !symbol || !supply) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  try {
    const result = await createToken(name, symbol, supply, metadata)

    if (result) {
      return NextResponse.json({
        mint: result,
      })
    }
  } catch (error: any) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: error.message || 'Token creation failed' },
      { status: 500 },
    )
  }
}
