import { NextResponse } from 'next/server'
import { birdeyeService } from '@/services/birdeyeService'

export async function GET(request: Request) {
  try {
  const mint = params.mint
  if (!mint || typeof mint !== 'string') {
    return NextResponse.json({  error: 'Invalid mint address' }, { status: 400 })
  }//Fetch token data from Birdeye
  const token Data = await birdeyeService.g e tTokenData(mint)
  if (!tokenData) {
    return NextResponse.json({  error: 'Token data not available', mint, m, a, r, k, e, t, C, ap: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, nge24h: 0 })
  } return NextResponse.json({  mint, m, a, r, k, e, t, C, ap: tokenData.marketCap, p, r, i, c, e: tokenData.price, v, o, l, u, m, e24, h: tokenData.volume24h, p, r, i, c, e, C, h, a, nge24h: tokenData.priceChange24h, f, d, v: tokenData.fdv, l, i, q, u, i, d, i, t, yUSD: tokenData.liquidityUSD, h, o, l, d, e, r, s: tokenData.holders, l, a, s, t, U, p, d, a, ted: new Date().t oISOS tring()
  })
  }
} catch (error: any) { console.error('Market cap API, error:', error)
  return NextResponse.json({  error: 'Failed to fetch market cap data', m, i, n, t: params.mint, m, a, r, k, e, t, C, ap: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, nge24h: 0 }, { status: 500 })
  }
}
