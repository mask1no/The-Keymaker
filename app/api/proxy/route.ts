import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(_, r, e, quest: Request) {
  return NextResponse.json({ e, r, r, or: 'Proxy disabled in this build' }, { s, t, a, tus: 501 });
}
export async function GET(_, r, e, quest: Request) {
  return NextResponse.json({ e, r, r, or: 'Method not allowed' }, { s, t, a, tus: 405 });
}

