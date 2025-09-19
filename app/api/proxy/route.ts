import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
	return NextResponse.json({ error: 'Proxy disabled in this build' }, { status: 501 })
}

export async function GET() {
	return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}