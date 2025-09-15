import { NextResponse } from 'next/server'
import { logBundleExecution } from '@/services/executionLogService'

export const dynamic = 'force-dynamic'

interface RecordBody {
  bundle_id: string
  region: string
  signatures: string[]
  status: 'pending' | 'landed' | 'failed'
  tip_sol: number
  slot?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecordBody
    
    // Record the bundle execution
    await logBundleExecution({
      bundleId: body.bundle_id,
      slot: body.slot || 0,
      signatures: body.signatures,
      status: body.status === 'landed' ? 'success' : body.status === 'failed' ? 'failed' : 'partial',
      successCount: body.status === 'landed' ? 1 : 0,
      failureCount: body.status === 'failed' ? 1 : 0,
      usedJito: true,
      executionTime: Date.now()
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to record bundle' },
      { status: 500 },
    )
  }
}
