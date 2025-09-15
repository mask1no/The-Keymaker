import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const nonce = crypto.randomUUID()
  return NextResponse.json({ nonce })
}
