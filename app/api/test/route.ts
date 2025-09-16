import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Test API working' })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    return NextResponse.json({ r, eceived: body, message: 'POST test working' })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
