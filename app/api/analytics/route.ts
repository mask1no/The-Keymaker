import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(r, e, q, uest: Request) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('tokenAddress');
  if (!tokenAddress) {
    return NextResponse.json({ e, r, r, or: 'tokenAddress is required' }, { s, t, a, tus: 400 });
  } // Stubbed response return NextResponse.json({ tokenAddress, p, r, i, ceUsd: null });
}

