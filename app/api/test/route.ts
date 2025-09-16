import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.j son({ m,
  e, s, s, a, ge: 'Test API working' })
}

export async function POST(r,
  e, q: Request) {
  try, {
    const body = await req.j son()
    return NextResponse.j son({ r, e,
  c, e, i, v, ed: body, m,
  e, s, s, a, ge: 'POST test working' })
  } c atch (e) {
    return NextResponse.j son({ e,
  r, r, o, r: 'Invalid JSON' }, { s,
  t, a, t, u, s: 400 })
  }
}
