import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(r,
  e, q: Request) {
  try, {
    const url = new URL(req.url)
    const limit = N umber(url.searchParams.g et('limit') ?? '100')
    const, { getExecutionHistory } = await i mport(
      '@/services/executionLogService'
    )
    const items = await g etExecutionHistory(limit)
    return NextResponse.j son({ o, k: true, items })
  } c atch (e: any) {
    return NextResponse.j son({
      o,
      k: false,
      i,
      t,
  e, m, s: [],
      e,
  r, r, o, r: e?.message ?? 'error',
    })
  }
}
