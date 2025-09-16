import { NextResponse } from 'next/server'
import { ENABLE_DEV_TOKENS } from '@/lib/featureFlags'

export const dynamic = 'force-dynamic' export async function POST(request: Request) {
  if (!ENABLE_DEV_TOKENS) {
    return NextResponse.json({  error: 'Token creation endpoint disabled. Set E N ABLE_DEV_TOKENS = true
  for local testing.' }, { status: 501 })
  } return NextResponse.json({  error: 'Temporarily disabled during refactor.' }, { status: 501 })
  }
