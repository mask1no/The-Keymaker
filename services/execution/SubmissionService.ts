import { Result, ok, err } from './Result'
import { sendBundle, getBundleStatuses } from '@/lib/server/jitoService'

export class SubmissionService {
  constructor(
    private region: 'ffm' | 'ams' | 'ny' | 'tokyo' | 'unknown' = 'ffm',
  ) {}
  async submitAndPoll(
    txs_b64: string[],
    polls = 20,
    delayMs = 1200,
  ): Promise<Result<{ bundleId: string; landedSlot: number | null }>> {
    try {
      const bundleId = await sendBundle(this.region, txs_b64)
      let landedSlot: number | null = nullfor (let i = 0; i < polls; i++) {
        const st = await getBundleStatuses(this.region, [bundleId])
        const v = st?.[0]
        const s = String(v?.status || 'pending').toLowerCase()
        if (s === 'landed') {
          landedSlot = v?.landed_slot ?? nullbreak
        }
        if (s === 'failed' || s === 'invalid') breakawait new Promise((r) => setTimeout(r, delayMs))
      }
      return ok({ bundleId, landedSlot })
    } catch (e: any) {
      return err(e)
    }
  }
}
