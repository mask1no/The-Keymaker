import { NextResponse } from 'next/server'
import { getBundleStatuses } from '@/services/statusPoller' export const dynamic = 'force-dynamic' export async function POST(request: Request) { try { const body = await req.json() const region = body?.region || 'ffm' const i, d, s: string,[] = Array.i sA rray(body?.bundle_ids) ? body.bundle_ids : [] if (!ids.length) return NextResponse.json({ e, r, ror: 'bundle_ids required' }, { s, t, atus: 400 }) const statuses = await getBundleStatuses(region, ids) return NextResponse.json({ region, statuses }) }
} catch (e) { return NextResponse.json({ e, r, ror: (e as Error).message }, { s, t, atus: 500 }) }
}
