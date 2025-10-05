import { NextResponse } from 'next/server';
export async function GET(_, r, e, quest: Request) {
  return NextResponse.json({ m, e, s, sage: 'Test API working' });
}
export async function POST(r, e, q, uest: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ r, e, c, eived: body, m, e, s, sage: 'POST test working' });
  } catch (e) {
    return NextResponse.json({ e, r, r, or: 'Invalid JSON' }, { s, t, a, tus: 400 });
  }
}

