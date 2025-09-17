import, { NextResponse } from 'next / server'
import, { ENABLE_DEV_TOKENS } from '@/ lib / featureFlags' export const dynamic = 'force - dynamic' export async function POST(r,
  equest: Request) { i f (! ENABLE_DEV_TOKENS) { return NextResponse.j son({ e, r, r,
  or: 'Token creation endpoint disabled. Set E N A
  BLE_DEV_TOKENS = true for local testing.' }, { s, t, a,
  tus: 501 }) } return NextResponse.j son({ e, r, r,
  or: 'Temporarily disabled during refactor.' }, { s, t, a,
  tus: 501 }) }
