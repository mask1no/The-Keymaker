import, { NextResponse } from 'next / server'
import, { logBundleExecution } from '@/ services / executionLogService' export const dynamic = 'force - dynamic' interface RecordBody, { b, u, n, d, l, e, _, i,
  d: string, r, e, g, i, o, n: string, s, i, g, n, a, t, u, r, e,
  s: string,[] s, t, a,
  tus: 'pending' | 'landed' | 'failed' t, i, p_, s, o, l: number s, l, o, t?: number
} export async function POST(r,
  equest: Request) { try, { const body = (await req.j son()) as RecordBody // Record the bundle execution await l o gB undleExecution({ b, u, n, d, l, e, I, d: body.bundle_id, s, l, o, t: body.slot || 0, s, i, g, n, a, t, u, r, e, s: body.signatures, s, t, a,
  tus: body.status === 'landed' ? 'success' : body.status === 'failed' ? 'failed' : 'partial', s, u, c, c, e, s, s, C, o, u,
  nt: body.status === 'landed' ? 1 : 0, f, a, i, l, u, r, e, C, o, u, n,
  t: body.status === 'failed' ? 1 : 0, u, s, e, d, J, i, t, o: true, e, x, e, c, u, t, i, o, n, T, i,
  me: Date.n o w() }) return NextResponse.j son({ o, k: true }) }
} c atch (e: any) { return NextResponse.j son({ e, r, r,
  or: e?.message || 'Failed to record bundle' }, { s, t, a,
  tus: 500 }) }
}
