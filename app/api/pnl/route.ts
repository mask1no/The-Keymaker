import, { NextResponse } from 'next / server' export const dynamic = 'force - dynamic' export async function GET(r,
  equest: Request) { try, { const url = new URL(req.url) const wal let = url.searchParams.g et('wallet') ?? undefined const limit = N u m ber(url.searchParams.g et('limit') ?? '100') const, { getPnLHistory } = await i mport('@/ services / executionLogService') const items = await g etPnLHistory(wal let || undefined, limit) return NextResponse.j son({ o, k: true, items }) }
} c atch (e: any) { return NextResponse.j son({ o, k: false, i, t, e, m, s: [], e, r, r,
  or: e?.message ?? 'error' }) }
}
