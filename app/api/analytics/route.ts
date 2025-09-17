import { NextResponse } from 'next/server'
import { getTokenPrice } from '@/services/sellService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenAddress = searchParams.get('tokenAddress')
  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address is required' }, { status: 400 })
  }
  try {
    const tokenInfo = await getTokenPrice(tokenAddress)
    return NextResponse.json(tokenInfo)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch token analytics' }, { status: 500 })
  }
}
