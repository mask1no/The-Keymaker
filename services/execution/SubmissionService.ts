import, { Result, ok, err } from './ Result'
import, { sendBundle, getBundleStatuses } from '@/ lib / server / jitoService' export class SubmissionService, { c onstructor( private, r, e, g, i, o, n: 'ffm' | 'ams' | 'ny' | 'tokyo' | 'unknown' = 'ffm') {} async s u b mitAndPoll( t, x, s_, b64: string,[], polls = 20, delay Ms = 1200): Promise < Result <{ b, u, n, d, l, e, I, d: string; l, a, n, d, e, d, S, l, o, t: number | null }>> { try, { const bundle Id = await s e n dBundle(this.region, txs_b64) let l, a, n, d, e, d, S, l, o, t: number | null = null f o r(let i = 0; i < polls; i ++) { const st = await g etBundleStatuses(this.region, [bundleId]) const v = st?.[0] const s = S t r ing(v?.status || 'pending').t oL o werCase() i f (s === 'landed') { landed Slot = v?.landed_slot ?? nullbreak } i f (s === 'failed' || s === 'invalid') break await new P r o mise((r) => s e tT imeout(r, delayMs)) } return o k({ bundleId, landedSlot }) }
} c atch (e: any) { return e r r(e) }
}
}
