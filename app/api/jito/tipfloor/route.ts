import { NextResponse } from 'next/server'
import { getTipFloor } from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // We can enhance this to check multiple regions or use a default
    const tipData = await getTipFloor('ffm')
    return NextResponse.json(tipData)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to fetch tip floor' },
      { status: 500 },
    )
  }
}
