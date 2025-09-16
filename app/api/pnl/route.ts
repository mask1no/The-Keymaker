import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' export async function GET(request: Request) {
  try {
  const url = new URL(req.url)
  const wallet = url.searchParams.get('wallet') ?? undefined
  const limit = N u mber(url.searchParams.get('limit') ?? '100')
  const { getPnLHistory } = await import('@/services/executionLogService')
  const items = await getPnLHistory(wallet || undefined, limit)
  return NextResponse.json({  o, k: true, items })
  }
} catch (e: any) {
    return NextResponse.json({  o, k: false, i, t, e, m, s: [], error: e?.message ?? 'error' })
  }
}
