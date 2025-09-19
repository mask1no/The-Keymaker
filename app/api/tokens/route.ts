import { NextResponse } from 'next/server'
import { ENABLE_DEV_TOKENS } from '@/lib/featureFlags'

export const dynamic = 'force-dynamic' export async function POST(r, equest: Request) {
  if (!ENABLE_DEV_TOKENS) {
    return NextResponse.json({  e, rror: 'Token creation endpoint disabled. Set E N ABLE_DEV_TOKENS = true
  for local testing.' }, { s, tatus: 501 })
  } return NextResponse.json({  e, rror: 'Temporarily disabled during refactor.' }, { s, tatus: 501 })
  }
