import { NextResponse } from 'next/server'
import { getTipFloor } from '@/lib/server/jitoService'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tipData = await getTipFloor('ffm')
    return NextResponse.json(tipData)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'tipfloor failed' },
      { status: 500 },
    )
  }
}
