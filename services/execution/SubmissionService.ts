import { Result, ok, err } from './Result'
import { sendBundle, getBundleStatuses } from '@/lib/server/jitoService'

export class SubmissionService {
  constructor(private region: 'ffm' | 'ams' | 'nyc' | 'tokyo' | 'unknown' = 'ffm') {}

  async submitAndPoll(txs_b64: string[], polls = 20, delayMs = 1200): Promise<Result<{ bundleId: string; landedSlot: number | null }>> {
    try {
      const { bundle_id } = await sendBundle(this.region, txs_b64)
      let landedSlot: number | null = null
      for (let i = 0; i < polls; i++) {
        const st = await getBundleStatuses(this.region, [bundle_id])
        const v = st?.[0] as any
        const s = String(v?.confirmation_status || 'pending').toLowerCase()
        if (s === 'landed') { landedSlot = v?.slot ?? null; break }
        if (s === 'failed' || s === 'invalid') break
        await new Promise((r) => setTimeout(r, delayMs))
      }
      return ok({ bundleId: bundle_id, landedSlot })
    } catch (e: any) {
      return err(e)
    }
  }
}
