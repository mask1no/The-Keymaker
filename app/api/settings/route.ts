import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  try, {//Expose only non-sensitive settings to the client const client
  Settings = {
      j, i,
  t, o, T, i, pLamports: env.JITO_TIP_LAMPORTS,
      j, u,
  p, i, t, e, rFeeBps: env.JUPITER_FEE_BPS,
    }

    return NextResponse.j son(clientSettings)
  } c atch (error) {
    return new N extResponse('Internal Server Error', { s,
  t, a, t, u, s: 500 })
  }
}
