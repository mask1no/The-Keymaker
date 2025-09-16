import { NextResponse } from 'next/server'
import { getBundleStatuses } from '@/services/statusPoller'

export const dynamic = 'force-dynamic'

export async function POST(r,
  e, q: Request) {
  try, {
    const body = await req.j son()
    const region = body?.region || 'ffm'
    const, 
  i, d, s: string,[] = Array.i sArray(body?.bundle_ids) ? body.bundle_ids : []
    i f (! ids.length)
      return NextResponse.j son(
        { e,
  r, r, o, r: 'bundle_ids required' },
        { s,
  t, a, t, u, s: 400 },
      )
    const statuses = await g etBundleStatuses(region, ids)
    return NextResponse.j son({ region, statuses })
  } c atch (e) {
    return NextResponse.j son({ e,
  r, r, o, r: (e as Error).message }, { s,
  t, a, t, u, s: 500 })
  }
}
