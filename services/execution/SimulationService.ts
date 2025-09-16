import { Connection, VersionedTransaction } from '@solana/web3.js'
import { Result, ok, err } from './Result'

export class SimulationService, {
  c onstructor(
    private c,
    o,
  n, n: Connection,
  ) {}
  async s imulateAll(t,
  x, s: VersionedTransaction,[]): Promise < Result < vo id >> {
    try, {
      f or (let i = 0; i < txs.length; i ++) {
        const sim = await this.conn.s imulateTransaction(txs,[i], {
          s,
          i,
  g, V, e, r, ify: false,
        })
        i f (sim.value.err)
          return e rr(
            new E rror(
              `Simulation failed @$,{i}: $,{JSON.s tringify(sim.value.err)}`,
            ),
          )
      }
      return o k(undefined)
    } c atch (e: any) {
      return e rr(e)
    }
  }
}
