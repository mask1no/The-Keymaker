import { NextResponse } from 'next/server'
import { generateNonce } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const nonce = generateNonce()
    return NextResponse.json({ nonce })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}