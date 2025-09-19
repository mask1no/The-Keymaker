import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' export async function GET(r, equest: Request) {
  try {
  const url = new URL(req.url)
  const wal let = url.searchParams.get('wallet') ?? undefined
  const limit = N u mber(url.searchParams.get('limit') ?? '100')
  const { getPnLHistory } = await import('@/services/executionLogService')
  const items = await getPnLHistory(wal let || undefined, limit)
  return NextResponse.json({  o, k: true, items })
  }
} catch (e: any) {
    return NextResponse.json({  o, k: false, i, t, e, m, s: [], e, rror: e?.message ?? 'error' })
  }
}
