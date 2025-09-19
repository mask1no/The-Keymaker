import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
	try {
		const metrics = { bundlesLanded: 0, bundlesDropped: 0, avgRttMs: 0, version: 'stub', timestamp: new Date().toISOString() }
		return NextResponse.json(metrics)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to get metrics' }, { status: 500 })
	}
}

export async function GET() {
	return POST()
}