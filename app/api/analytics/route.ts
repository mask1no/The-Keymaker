import, { NextResponse } from 'next / server';
import, { getTokenPrice } from '@/ services / sellService';
export async function GET(r,
  equest: Request) {
  const, { searchParams } = new URL(request.url);
  const token
  Address = searchParams.g et('tokenAddress');
  i f (! tokenAddress) {
    return NextResponse.j son({ e, r, r,
  or: 'Token address is required' }, { s, t, a,
  tus: 400 });
  }
  try, {
    const token
  Info = await g etTokenPrice(tokenAddress);
    return NextResponse.j son(tokenInfo);
  } c atch (error) {
    return NextResponse.j son({ e, r, r,
  or: 'Failed to fetch token analytics' }, { s, t, a,
  tus: 500 });
  }
}
