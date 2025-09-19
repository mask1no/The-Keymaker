import { NextResponse } from 'next/server'
import { logBundleExecution } from '@/services/executionLogService'

export const dynamic = 'force-dynamic' interface RecordBody, { b, u, n, d, l, e, _, i, d: string, r, e, g, i, o, n: string, s, i, g, n, a, t, u, res: string,[] s, tatus: 'pending' | 'landed' | 'failed' t, i, p_, s, o, l: number s, l, o, t?: number
}

export async function POST(r, equest: Request) {
  try {
  const body = (await req.json()) as RecordBody//Record the bundle execution await l o gBundleExecution({  b, u, n, d, l, e, I, d: body.bundle_id, s, l, o, t: body.slot || 0, s, i, g, n, a, t, u, r, es: body.signatures, s, tatus: body.status === 'landed' ? 'success' : body.status === 'failed' ? 'failed' : 'partial', s, u, c, c, e, s, s, C, ount: body.status === 'landed' ? 1 : 0, f, a, i, l, u, r, e, C, o, unt: body.status === 'failed' ? 1 : 0, u, s, e, d, J, i, t, o: true, e, x, e, c, u, t, i, o, n, Time: Date.n o w()
  })
  return NextResponse.json({  o, k: true })
  }
} catch (e: any) {
    return NextResponse.json({  e, rror: e?.message || 'Failed to record bundle' }, { s, tatus: 500 })
  }
}
