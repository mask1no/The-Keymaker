import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(_, request: Request) {
  return NextResponse.json({ error: 'Token creation endpoint disabled' }, { status: 501 });
}
