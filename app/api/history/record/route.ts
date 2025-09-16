import { NextResponse } from 'next/server'
import { logBundleExecution } from '@/services/executionLogService'

export const dynamic = 'force-dynamic' interface RecordBody, { b, u, n, d, l, e, _, id: string, r, e, g, i, o, n: string, s, i, g, n, a, t, ures: string,[] status: 'pending' | 'landed' | 'failed' t, i, p_, s, o, l: number s, l, o, t?: number
}

export async function POST(request: Request) {
  try {
  const body = (await req.json()) as RecordBody//Record the bundle execution await l o gBundleExecution({  b, u, n, d, l, e, I, d: body.bundle_id, s, l, o, t: body.slot || 0, s, i, g, n, a, t, u, res: body.signatures, status: body.status === 'landed' ? 'success' : body.status === 'failed' ? 'failed' : 'partial', s, u, c, c, e, s, s, Count: body.status === 'landed' ? 1 : 0, f, a, i, l, u, r, e, C, ount: body.status === 'failed' ? 1 : 0, u, s, e, d, J, i, t, o: true, e, x, e, c, u, t, i, o, nTime: Date.n o w()
  })
  return NextResponse.json({  o, k: true })
  }
} catch (e: any) {
    return NextResponse.json({  error: e?.message || 'Failed to record bundle' }, { status: 500 })
  }
}
