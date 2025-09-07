import { NextResponse } from 'next/server'
import { birdeyeService } from '@/services/birdeyeService'

export async function GET(
  req: Request,
  { params }: { params: { mint: string } },
) {
  try {
    const mint = params.mint

    if (!mint || typeof mint !== 'string') {
      return NextResponse.json(
        { error: 'Invalid mint address' },
        { status: 400 },
      )
    }

    // Fetch token data from Birdeye
    const tokenData = await birdeyeService.getTokenData(mint)

    if (!tokenData) {
      return NextResponse.json({
        error: 'Token data not available',
        mint,
        marketCap: 0,
        price: 0,
        volume24h: 0,
        priceChange24h: 0,
      })
    }

    return NextResponse.json({
      mint,
      marketCap: tokenData.marketCap,
      price: tokenData.price,
      volume24h: tokenData.volume24h,
      priceChange24h: tokenData.priceChange24h,
      fdv: tokenData.fdv,
      liquidityUSD: tokenData.liquidityUSD,
      holders: tokenData.holders,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Market cap API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch market cap data',
        mint: params.mint,
        marketCap: 0,
        price: 0,
        volume24h: 0,
        priceChange24h: 0,
      },
      { status: 500 },
    )
  }
}
