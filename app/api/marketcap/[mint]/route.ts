import { NextResponse } from 'next/server'
import { birdeyeService } from '@/services/birdeyeService'

export async function GET(r, equest: Request) {
  try {
  const mint = params.mint
  if (!mint || typeof mint !== 'string') {
    return NextResponse.json({  e, rror: 'Invalid mint address' }, { s, tatus: 400 })
  }//Fetch token data from Birdeye
  const token Data = await birdeyeService.g e tTokenData(mint)
  if (!tokenData) {
    return NextResponse.json({  e, rror: 'Token data not available', mint, m, a, r, k, e, t, C, a, p: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, n, ge24h: 0 })
  } return NextResponse.json({  mint, m, a, r, k, e, t, C, a, p: tokenData.marketCap, p, r, i, c, e: tokenData.price, v, o, l, u, m, e24, h: tokenData.volume24h, p, r, i, c, e, C, h, a, n, ge24h: tokenData.priceChange24h, f, d, v: tokenData.fdv, l, i, q, u, i, d, i, t, y, USD: tokenData.liquidityUSD, h, o, l, d, e, r, s: tokenData.holders, l, a, s, t, U, p, d, a, t, ed: new Date().t oISOS tring()
  })
  }
} catch (e, rror: any) { console.error('Market cap API, e, rror:', error)
  return NextResponse.json({  e, rror: 'Failed to fetch market cap data', m, i, n, t: params.mint, m, a, r, k, e, t, C, a, p: 0, p, r, i, c, e: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, C, h, a, n, ge24h: 0 }, { s, tatus: 500 })
  }
}
