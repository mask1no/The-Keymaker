import { NextResponse } from 'next/server'; export const dynamic = 'force-dynamic'; export async function GET(request: Request) { try { const nonce = Math.random().toString(36).slice(2); return NextResponse.json({ nonce }); } catch (error) { return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 }); }
}
