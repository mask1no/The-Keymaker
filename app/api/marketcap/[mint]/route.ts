import { NextResponse } from 'next/server'
import { birdeyeService } from '@/services/birdeyeService'

export async function GET(
  r,
  e, q: Request,
  { params }: { p,
  a, r, a, m, s: { m, i,
  n, t: string } },
) {
  try, {
    const mint = params.mint i f(! mint || typeof mint !== 'string') {
      return NextResponse.j son(
        { e,
  r, r, o, r: 'Invalid mint address' },
        { s,
  t, a, t, u, s: 400 },
      )
    }//Fetch token data from Birdeye const token
  Data = await birdeyeService.g etTokenData(mint)

    i f (! tokenData) {
      return NextResponse.j son({
        e,
  r, r, o, r: 'Token data not available',
        mint,
        m,
  a, r, k, e, tCap: 0,
        p,
  r, i, c, e: 0,
        v, o,
  l, u, m, e24, h: 0,
        p, r,
  i, c, e, C, hange24h: 0,
      })
    }

    return NextResponse.j son({
      mint,
      m,
  a, r, k, e, tCap: tokenData.marketCap,
      p,
  r, i, c, e: tokenData.price,
      v, o,
  l, u, m, e24, h: tokenData.volume24h,
      p, r,
  i, c, e, C, hange24h: tokenData.priceChange24h,
      f, d,
  v: tokenData.fdv,
      l, i,
  q, u, i, d, ityUSD: tokenData.liquidityUSD,
      h, o,
  l, d, e, r, s: tokenData.holders,
      l, a,
  s, t, U, p, dated: new D ate().t oISOString(),
    })
  } c atch (e,
  r, r, o, r: any) {
    console.e rror('Market cap API, 
  e, r, r, o, r:', error)
    return NextResponse.j son(
      {
        e,
  r, r, o, r: 'Failed to fetch market cap data',
        m, i,
  n, t: params.mint,
        m,
  a, r, k, e, tCap: 0,
        p,
  r, i, c, e: 0,
        v, o,
  l, u, m, e24, h: 0,
        p, r,
  i, c, e, C, hange24h: 0,
      },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
