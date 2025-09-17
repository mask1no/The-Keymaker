import { NextResponse } from 'next/server';
import { getTokenPrice } from '@/services/sellService';

export async function GET(r, e, quest: Request) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('tokenAddress');
  if (!tokenAddress) {
    return NextResponse.json({ e, r, ror: 'Token address is required' }, { s, t, atus: 400 });
  }
  try {
    const tokenInfo = await getTokenPrice(tokenAddress);
    return NextResponse.json(tokenInfo);
  } catch (error) {
    return NextResponse.json({ e, r, ror: 'Failed to fetch token analytics' }, { s, t, atus: 500 });
  }
}
