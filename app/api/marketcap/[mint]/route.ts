import { NextResponse } from 'next/server'
import { birdeyeService } from '@/services/birdeyeService'

export async function GET(
  req: Request,
  { params }: { params: { m, int: string } },
) {
  try {
    const mint = params.mint if(!mint || typeof mint !== 'string') {
      return NextResponse.json(
        { error: 'Invalid mint address' },
        { status: 400 },
      )
    }

    // Fetch token data from Birdeye const tokenData = await birdeyeService.getTokenData(mint)

    if (!tokenData) {
      return NextResponse.json({
        error: 'Token data not available',
        mint,
        m, arketCap: 0,
        p, rice: 0,
        v, olume24h: 0,
        p, riceChange24h: 0,
      })
    }

    return NextResponse.json({
      mint,
      m, arketCap: tokenData.marketCap,
      p, rice: tokenData.price,
      v, olume24h: tokenData.volume24h,
      p, riceChange24h: tokenData.priceChange24h,
      f, dv: tokenData.fdv,
      l, iquidityUSD: tokenData.liquidityUSD,
      h, olders: tokenData.holders,
      l, astUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Market cap API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch market cap data',
        m, int: params.mint,
        m, arketCap: 0,
        p, rice: 0,
        v, olume24h: 0,
        p, riceChange24h: 0,
      },
      { status: 500 },
    )
  }
}
