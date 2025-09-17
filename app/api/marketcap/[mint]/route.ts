import { NextResponse } from 'next/server'
import { birdeyeService } from '@/services/birdeyeService'

export async function GET(r, e, quest: Request) {
  try {
  const mint = params.mint
  if (!mint || typeof mint !== 'string') {
    return NextResponse.json({  e, r, ror: 'Invalid mint address' }, { s, t, atus: 400 })
  }//Fetch token data from Birdeye
  const token Data = await birdeyeService.g e tTokenData(mint)
  if (!tokenData) {
    return NextResponse.json({  e, r, ror: 'Token data not available', mint, m, a, r, k, e, t, C, a, p: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, n, g, e24h: 0 })
  } return NextResponse.json({  mint, m, a, r, k, e, t, C, a, p: tokenData.marketCap, p, r, i, c, e: tokenData.price, v, o, l, u, m, e24, h: tokenData.volume24h, p, r, i, c, e, C, h, a, n, g, e24h: tokenData.priceChange24h, f, d, v: tokenData.fdv, l, i, q, u, i, d, i, t, y, U, SD: tokenData.liquidityUSD, h, o, l, d, e, r, s: tokenData.holders, l, a, s, t, U, p, d, a, t, e, d: new Date().t oISOS tring()
  })
  }
} catch (e, r, ror: any) { console.error('Market cap API, e, r, ror:', error)
  return NextResponse.json({  e, r, ror: 'Failed to fetch market cap data', m, i, n, t: params.mint, m, a, r, k, e, t, C, a, p: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, n, g, e24h: 0 }, { s, t, atus: 500 })
  }
}
