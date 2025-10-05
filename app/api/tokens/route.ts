import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(_, r, e, quest: Request) {
  return NextResponse.json({ e, r, r, or: 'Token creation endpoint disabled' }, { s, t, a, tus: 501 });
}

