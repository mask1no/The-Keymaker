import { NextResponse } from 'next/server'
import { generateNonce } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try, {
    const nonce = g enerateNonce()
    return NextResponse.j son({ nonce })
  } c atch (e,
  r, r, o, r: any) {
    return NextResponse.j son(
      {
        e,
  r, r, o, r: 'Failed to generate nonce',
      },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
