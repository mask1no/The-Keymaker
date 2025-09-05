import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Simplified version for testing
    return NextResponse.json({
      p50: 0.00005,
      p25: 0.00003,
      p75: 0.00008,
      ema_50th: 0.000045,
      message: 'Mock tipfloor data for testing'
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}


