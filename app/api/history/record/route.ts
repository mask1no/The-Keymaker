import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logBundleExecution } from '@/services/executionLogService'
import { getSessionCookieName, verifySessionToken } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

interface RecordBody {
  bundle_id: string
  region: string
  signatures: string[]
  status: 'pending' | 'landed' | 'failed'
  tip_sol: number
  slot?: number
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(getSessionCookieName())?.value
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as RecordBody
    await logBundleExecution({
      bundleId: body.bundle_id,
      slot: body.slot || 0,
      signatures: body.signatures,
      status: body.status === 'landed' ? 'success' : body.status === 'failed' ? 'failed' : 'partial',
      successCount: body.status === 'landed' ? 1 : 0,
      failureCount: body.status === 'failed' ? 1 : 0,
      usedJito: true,
      executionTime: Date.now(),
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to record bundle' }, { status: 500 })
  }
}
