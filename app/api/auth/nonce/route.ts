import { NextResponse } from 'next/server'
import { generateNonce } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const nonce = generateNonce()
    return NextResponse.json({ nonce })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to generate nonce' 
    }, { status: 500 })
  }
}