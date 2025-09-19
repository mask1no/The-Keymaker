import { NextResponse } from 'next/server'
import { getTipFloor } from '@/lib/server/jitoService'
import { rateLimit } from '@/app/api/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	try {
		const url = new URL(request.url)
		const region = (url.searchParams.get('region') || 'ffm') as any
		const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon'
		const rl = rateLimit(`tipfloor:${ip}`, 60, 60_000)
		if (!rl.ok) {
			return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
		}
		const tipFloor = await getTipFloor(region)
		return NextResponse.json({
			p25: tipFloor.landed_tips_25th_percentile,
			p50: tipFloor.landed_tips_50th_percentile,
			p75: tipFloor.landed_tips_75th_percentile,
			ema_50th: tipFloor.ema_landed_tips_50th_percentile,
			region,
		})
	} catch (error: any) {
		console.error('Tip floor request failed:', error)
		return NextResponse.json({ error: error?.message || 'Failed to get tip floor' }, { status: 500 })
	}
}
