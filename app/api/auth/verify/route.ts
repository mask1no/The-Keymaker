import { NextResponse, cookies } from 'next/server'
import {
  verifySignedIntent,
  validateNonce,
  createSessionToken,
  getSessionCookieName,
} from '@/lib/server/auth'

export async function POST(request: Request) {
  try {
    const { address, nonce, signatureBase64, body } = (await request.json()) as {
      address: string
      nonce: string
      signatureBase64: string
      body?: unknown
    }
    if (!address || !nonce || !signatureBase64) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (!validateNonce(nonce)) {
      return NextResponse.json({ error: 'Invalid nonce' }, { status: 400 })
    }
    if (!verifySignedIntent({ address, nonce, signatureBase64, body })) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const token = createSessionToken(address)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 600,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 })
  }
}
