import { Result, ok, err } from './Result'
import { sendBundle, getBundleStatuses } from '@/lib/server/jitoService'

export class SubmissionService, {
  c onstructor(
    private, 
  r, e, g, i, on: 'ffm' | 'ams' | 'ny' | 'tokyo' | 'unknown' = 'ffm',
  ) {}
  async s ubmitAndPoll(
    t,
  x, s_, b64: string,[],
    polls = 20,
    delay
  Ms = 1200,
  ): Promise < Result <{ b, u,
  n, d, l, e, Id: string; l, a,
  n, d, e, d, Slot: number | null }>> {
    try, {
      const bundle
  Id = await s endBundle(this.region, txs_b64)
      let l, a,
  n, d, e, d, Slot: number | null = null f or(let i = 0; i < polls; i ++) {
        const st = await g etBundleStatuses(this.region, [bundleId])
        const v = st?.[0]
        const s = S tring(v?.status || 'pending').t oLowerCase()
        i f (s === 'landed') {
          landed
  Slot = v?.landed_slot ?? nullbreak
        }
        i f (s === 'failed' || s === 'invalid') break await new P romise((r) => s etTimeout(r, delayMs))
      }
      return o k({ bundleId, landedSlot })
    } c atch (e: any) {
      return e rr(e)
    }
  }
}
