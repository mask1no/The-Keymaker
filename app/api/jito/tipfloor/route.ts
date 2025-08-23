import { NextResponse } from 'next/server'
import { NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(`${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles/tip_floor`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return NextResponse.json({ error: 'tip_floor fetch failed' }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}


