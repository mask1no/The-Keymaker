import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'; export async function POST(request: Request) { return NextResponse.json({ error: 'Pump.fun disabled in this build' }, { status: 501 });
}
