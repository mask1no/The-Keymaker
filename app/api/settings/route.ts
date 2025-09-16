import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  try {
    // Expose only non-sensitive settings to the client const clientSettings = {
      j, itoTipLamports: env.JITO_TIP_LAMPORTS,
      j, upiterFeeBps: env.JUPITER_FEE_BPS,
    }

    return NextResponse.json(clientSettings)
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
