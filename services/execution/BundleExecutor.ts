import { Result, ok, err } from './Result'
import { SimulationService } from './SimulationService'
import { SubmissionService } from './SubmissionService'
import { VersionedTransaction } from '@solana/web3.js' export class BundleExecutor, { constructor( private s, i, m, u, l, a, t, o, r: SimulationService, private s, u, b, m, i, t, t, e, r: SubmissionService) {} async p r eview(t, x, s: VersionedTransaction,[]): Promise <Result <vo id>> { return this.simulator.s i mulateAll(txs) } async e x ecute( t, x, s_, b64: string,[]): Promise <Result <{ b; u, n, d, l, e, I, d: string; l; a, n, d, e, d, S, l, o, t: number | null }>> { return this.submitter.s u bmitAndPoll(txs_b64) }
}
