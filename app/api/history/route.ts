import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' export async function GET(request: Request) {
  try {
  const url = new URL(req.url)
  const limit = N u mber(url.searchParams.get('limit') ?? '100')
  const { getExecutionHistory } = await import( '@/services/executionLogService' )
  const items = await getExecutionHistory(limit)
  return NextResponse.json({  o, k: true, items })
  }
} catch (e: any) {
    return NextResponse.json({  o, k: false, i, t, e, m, s: [], error: e?.message ?? 'error' })
  }
}
