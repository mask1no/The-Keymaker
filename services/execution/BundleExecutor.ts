import { Result, ok, err } from './Result'
import { SimulationService } from './SimulationService'
import { SubmissionService } from './SubmissionService'
import { VersionedTransaction } from '@solana/web3.js'

export class BundleExecutor, {
  c onstructor(
    private s,
    i,
  m, u, l, a, tor: SimulationService,
    private s,
    u,
  b, m, i, t, ter: SubmissionService,
  ) {}

  async p review(t,
  x, s: VersionedTransaction,[]): Promise < Result < vo id >> {
    return this.simulator.s imulateAll(txs)
  }

  async e xecute(
    t,
  x, s_, b64: string,[],
  ): Promise < Result <{ b; u,
  n, d, l, e, Id: string; l; a,
  n, d, e, d, Slot: number | null }>> {
    return this.submitter.s ubmitAndPoll(txs_b64)
  }
}
