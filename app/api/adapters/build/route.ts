import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/server/rateLimit'
import { apiError } from '@/lib/server/apiError'
import { buildSplMintDemo } from '@/lib/adapters/splMintDemo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ipKey(req: Request) {
	return (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim()
}

export async function POST(req: Request) {
	if (!rateLimit(ipKey(req))) return apiError(429, 'rate_limited')
	const cl = Number(req.headers.get('content-length') || '0')
	if (cl > 8192) return apiError(413, 'payload_too_large')
	const body = await req.json().catch(() => ({} as any))
	const { adapter = 'spl-mint-demo', memo = 'ok' } = (body || {}) as { adapter?: string; memo?: string }
	// Future: switch(adapter) for pumpfun/raydium
	const ctx = { payer: process.env.PAYER_PUBKEY || 'unknown', region: 'ffm', priority: 'med', tipLamports: 5000 as number }
	const res = await buildSplMintDemo({ memo }, ctx)
	return NextResponse.json({ adapter, ixs: res.ixs.length, note: res.note })
}