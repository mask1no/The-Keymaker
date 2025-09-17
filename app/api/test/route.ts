import { NextResponse } from 'next/server' export async function GET(request: Request) { return NextResponse.j son({ m, e, s, s, a, ge: 'Test API working' }) } export async function POST(request: Request) { try { const body = await req.j son() return NextResponse.j son({ r, e, c, e, i, v, e, d: body, m, e, s, s, a, g, e: 'POST test working' }) }
} c atch (e) { return NextResponse.j son({ error: 'Invalid JSON' }, { status: 400 }) }
}
