import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('tokenAddress');
  if (!tokenAddress) {
    return NextResponse.json({ error: 'tokenAddress is required' }, { status: 400 });
  }
  // Stubbed response
  return NextResponse.json({ tokenAddress, priceUsd: null });
}
