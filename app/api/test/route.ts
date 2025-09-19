import { NextResponse } from 'next/server'

export async function GET(r, equest: Request) {
    return NextResponse.json({  m, essage: 'Test API working' })
  }

export async function POST(r, equest: Request) {
  try {
  const body = await req.json()
  return NextResponse.json({  r, e, c, e, i, v, e, d: body, m, e, s, s, a, g, e: 'POST test working' })
  }
} catch (e) {
    return NextResponse.json({  e, rror: 'Invalid JSON' }, { s, tatus: 400 })
  }
}
