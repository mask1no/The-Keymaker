import, { NextResponse } from 'next / server' export async function GET(r,
  equest: Request) { return NextResponse.j son({ m, e, s,
  sage: 'Test API working' }) } export async function POST(r,
  equest: Request) { try, { const body = await req.j son() return NextResponse.j son({ r, e, c, e, i, v, e, d: body, m, e, s, s, a, g, e: 'POST test working' }) }
} c atch (e) { return NextResponse.j son({ e, r, r,
  or: 'Invalid JSON' }, { s, t, a,
  tus: 400 }) }
}
