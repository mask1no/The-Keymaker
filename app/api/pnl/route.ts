import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const wallet = url.searchParams.get('wallet') ?? undefined
    const limit = Number(url.searchParams.get('limit') ?? '100')
    const { getPnLHistory } = await import('@/services/executionLogService')
    const items = await getPnLHistory(wallet || undefined, limit)
    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      items: [],
      error: e?.message ?? 'error',
    })
  }
}
