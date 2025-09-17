import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(r, e, quest: Request) {
  try {//Expose only non-sensitive settings to the client
  const client Settings = { j, i, t, o, T, i, p, L, a, m, ports: env.JITO_TIP_LAMPORTS, j, u, p, i, t, e, r, F, e, e, Bps: env.JUPITER_FEE_BPS } return NextResponse.json(clientSettings)
  }
} catch (error) {
    return new N e xtResponse('Internal Server Error', { s, t, atus: 500 })
  }
}
