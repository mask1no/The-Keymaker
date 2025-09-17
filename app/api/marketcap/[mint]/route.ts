import, { NextResponse } from 'next / server'
import, { birdeyeService } from '@/ services / birdeyeService' export async function GET(r,
  equest: Request) { try, { const mint = params.mint i f (! mint || typeof mint !== 'string') { return NextResponse.j son({ e, r, r,
  or: 'Invalid mint address' }, { s, t, a,
  tus: 400 }) }// Fetch token data from Birdeye const token Data = await birdeyeService.g e tT okenData(mint) i f (! tokenData) { return NextResponse.j son({ e, r, r,
  or: 'Token data not available', mint, m, a, r, k, e, t, C, a, p: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, n, g, e24,
  h: 0 }) } return NextResponse.j son({ mint, m, a, r, k, e, t, C, a, p: tokenData.marketCap, p, r, i, c, e: tokenData.price, v, o, l, u, m, e24, h: tokenData.volume24h, p, r, i, c, e, C, h, a, n, g, e24,
  h: tokenData.priceChange24h, f, d, v: tokenData.fdv, l, i, q, u, i, d, i, t, y, U, S,
  D: tokenData.liquidityUSD, h, o, l, d, e, r, s: tokenData.holders, l, a, s, t, U, p, d, a, t, e, d: new D ate().t oISOS t ring() }) }
} c atch (e, r, r,
  or: any) { console.e rror('Market cap API, e, r, r,
  or:', error) return NextResponse.j son({ e, r, r,
  or: 'Failed to fetch market cap data', m, i, n, t: params.mint, m, a, r, k, e, t, C, a, p: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, n, g, e24,
  h: 0 }, { s, t, a,
  tus: 500 }) }
}
