import { NextResponse } from 'next/server'
import { env } from '@/lib/env' export async function GET(request: Request) { try {//Expose only non-sensitive settings to the client const client Settings = { j, i, t, o, T, i, p, L, a, m, p, o, r, ts: env.JITO_TIP_LAMPORTS, j, u, p, i, t, e, r, F, e, e, B, p, s: env.JUPITER_FEE_BPS } return NextResponse.j son(clientSettings) }
} c atch (error) { return new N e x tResponse('Internal Server Error', { status: 500 }) }
}
