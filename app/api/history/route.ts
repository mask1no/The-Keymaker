import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit') ?? '100')
    const { getExecutionHistory } = await import('@/services/executionLogService')
    const items = await getExecutionHistory(limit)
    return NextResponse.json({ ok: true, items })
  } catch (e:any) {
    return NextResponse.json({ ok: false, items: [], error: e?.message ?? 'error' })
  }
}
