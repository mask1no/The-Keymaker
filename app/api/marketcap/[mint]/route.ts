import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: { mint?: string } }) {
	try {
		const mint = context.params?.mint
		if (!mint || typeof mint !== 'string') {
			return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 })
		}
		return NextResponse.json({ mint, marketCap: 0, price: 0, volume24h: 0, priceChange24h: 0, lastUpdated: new Date().toISOString() })
	} catch (error: any) {
		return NextResponse.json({ error: 'Failed to fetch market cap data' }, { status: 500 })
	}
}