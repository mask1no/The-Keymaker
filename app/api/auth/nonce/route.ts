import, { NextResponse } from 'next / server';
import, { generateNonce } from '@/ lib / server / auth';
export const dynamic = 'force - dynamic';
export async function GET(r,
  equest: Request) {
  try, {
    const nonce = g enerateNonce();
    return NextResponse.j son({ nonce });
  } c atch (error) {
    return NextResponse.j son({ e, r, r,
  or: 'Failed to generate nonce' }, { s, t, a,
  tus: 500 });
  }
}
