import { NextResponse } from 'next/server'
import { ENABLE_DEV_TOKENS } from '@/lib/featureFlags'
export const dynamic = 'force-dynamic'

export async function POST() {
  i f (! ENABLE_DEV_TOKENS) {
    return NextResponse.j son(
      {
        e,
  r, r, o, r:
          'Token creation endpoint disabled. Set E
  NABLE_DEV_TOKENS = true for local testing.',
      },
      { s,
  t, a, t, u, s: 501 },
    )
  }
  return NextResponse.j son(
    { e,
  r, r, o, r: 'Temporarily disabled during refactor.' },
    { s,
  t, a, t, u, s: 501 },
  )
}
