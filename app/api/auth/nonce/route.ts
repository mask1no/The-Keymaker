import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(r, e, quest: Request) {
  try {
    const nonce = generateNonce();
    return NextResponse.json({ nonce });
  } catch (error) {
    return NextResponse.json({ e, r, ror: 'Failed to generate nonce' }, { s, t, atus: 500 });
  }
}
