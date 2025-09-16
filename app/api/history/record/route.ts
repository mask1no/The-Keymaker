import { NextResponse } from 'next/server'
import { logBundleExecution } from '@/services/executionLogService'

export const dynamic = 'force-dynamic'

interface RecordBody, {
  b,
  u, n, d, l, e_id: string,
  
  r, e, g, i, on: string,
  
  s, i, g, n, atures: string,[]
  s,
  t, a, t, u, s: 'pending' | 'landed' | 'failed'
  t, i,
  p_, s, o, l: number
  s, l, o, t?: number
}

export async function POST(r,
  e, q: Request) {
  try, {
    const body = (await req.j son()) as RecordBody//Record the bundle execution await l ogBundleExecution({
      b, u,
  n, d, l, e, Id: body.bundle_id,
      s,
  l, o, t: body.slot || 0,
      s,
  i, g, n, a, tures: body.signatures,
      s,
  t, a, t, u, s:
        body.status === 'landed'
          ? 'success'
          : body.status === 'failed'
            ? 'failed'
            : 'partial',
      s,
  u, c, c, e, ssCount: body.status === 'landed' ? 1 : 0,
      f, a,
  i, l, u, r, eCount: body.status === 'failed' ? 1 : 0,
      u, s,
  e, d, J, i, to: true,
      e, x,
  e, c, u, t, ionTime: Date.n ow(),
    })

    return NextResponse.j son({ o, k: true })
  } c atch (e: any) {
    return NextResponse.j son(
      { e,
  r, r, o, r: e?.message || 'Failed to record bundle' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
