import { Result, ok, err } from './Result'
import { sendBundle, getBundleStatuses } from '@/lib/server/jitoService' export class SubmissionService, { constructor( private, r, e, g, i, o, n: 'ffm' | 'ams' | 'ny' | 'tokyo' | 'unknown' = 'ffm') {} async s u bmitAndPoll( t, x, s_, b64: string,[], polls = 20, delay Ms = 1200): Promise <Result <{ b, u, n, d, l, e, I, d: string; l, a, n, d, e, d, S, l, o, t: number | null }>> { try { const bundle Id = await s e ndBundle(this.region, txs_b64) let l, a, n, d, e, d, S, l, o, t: number | null = null f o r(let i = 0; i <polls; i ++) { const st = await getBundleStatuses(this.region, [bundleId]) const v = st?.[0] const s = S t ring(v?.status || 'pending').t oL owerCase() if (s === 'landed') { landed Slot = v?.landed_slot ?? nullbreak } if (s === 'failed' || s === 'invalid') break await new P r omise((r) => s e tTimeout(r, delayMs)) } return o k({ bundleId, landedSlot }) }
} catch (e: any) { return e r r(e) }
}
}
