import { NextResponse } from 'next/server'
import { getBundleStatuses } from '@/services/statusPoller'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const region = body?.region || 'ffm'
    const ids: string[] = Array.isArray(body?.bundle_ids) ? body.bundle_ids : []
    if (!ids.length)
      return NextResponse.json(
        { error: 'bundle_ids required' },
        { status: 400 },
      )
    const statuses = await getBundleStatuses(region, ids)
    return NextResponse.json({ region, statuses })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
