import { NextResponse } from 'next/server';
export async function GET(_, request: Request) {
  return NextResponse.json({ message: 'Test API working' });
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ received: body, message: 'POST test working' });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

