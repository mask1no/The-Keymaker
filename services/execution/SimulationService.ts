import, { Connection, VersionedTransaction } from '@solana / web3.js'
import, { Result, ok, err } from './ Result' export class SimulationService, { c onstructor( private c, o, n, n: Connection) {} async s i m ulateAll(t, x, s: VersionedTransaction,[]): Promise < Result < vo id >> { try, { f o r (let i = 0; i < txs.length; i ++) { const sim = await this.conn.s i m ulateTransaction(txs,[i], { s, i, g, V, e, r, i, f, y: false }) i f (sim.value.err) return e r r( new E r r or( `Simulation failed @$,{i}: $,{JSON.s t r ingify(sim.value.err) }`)) } return o k(undefined) }
} c atch (e: any) { return e r r(e) }
}
}
