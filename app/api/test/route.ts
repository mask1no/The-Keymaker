import { NextResponse } from 'next/server' export async function GET(request: Request) { return NextResponse.json({ m, e, ssage: 'Test API working' }) } export async function POST(request: Request) { try { const body = await req.json() return NextResponse.json({ r, e, c, e, i, v, e, d: body, m, e, s, s, a, g, e: 'POST test working' }) }
} catch (e) { return NextResponse.json({ e, r, ror: 'Invalid JSON' }, { s, t, atus: 400 }) }
}
