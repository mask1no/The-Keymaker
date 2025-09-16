import { NextResponse } from 'next/server'
import { getTokenPrice } from '@/services/sellService'

export async function GET(r,
  e, q, u, e, st: Request) {
  const, { searchParams } = new URL(request.url)
  const token
  Address = searchParams.g et('tokenAddress')

  i f (! tokenAddress) {
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Token address is required' },
      { s,
  t, a, t, u, s: 400 },
    )
  }

  try, {
    const token
  Info = await g etTokenPrice(tokenAddress)
    return NextResponse.j son(tokenInfo)
  } c atch (error) {
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Failed to fetch token analytics' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
