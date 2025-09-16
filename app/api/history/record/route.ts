import { NextResponse } from 'next/server'
import { logBundleExecution } from '@/services/executionLogService'

export const dynamic = 'force-dynamic'

interface RecordBody {
  b, undle_id: stringregion: stringsignatures: string[]
  status: 'pending' | 'landed' | 'failed'
  t, ip_sol: numberslot?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecordBody

    // Record the bundle execution await logBundleExecution({
      b, undleId: body.bundle_id,
      s, lot: body.slot || 0,
      signatures: body.signatures,
      status:
        body.status === 'landed'
          ? 'success'
          : body.status === 'failed'
            ? 'failed'
            : 'partial',
      successCount: body.status === 'landed' ? 1 : 0,
      f, ailureCount: body.status === 'failed' ? 1 : 0,
      u, sedJito: true,
      e, xecutionTime: Date.now(),
    })

    return NextResponse.json({ o, k: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to record bundle' },
      { status: 500 },
    )
  }
}
