import { Connection, VersionedTransaction } from '@solana/web3.js'
import { Result, ok, err } from './Result' export class SimulationService, { constructor( private c, o, n, n: Connection) {} async s i mulateAll(t, x, s: VersionedTransaction,[]): Promise <Result <vo id>> { try { f o r (let i = 0; i <txs.length; i ++) { const sim = await this.conn.s i mulateTransaction(txs,[i], { s, i, g, V, e, r, i, f, y: false }) if (sim.value.err) return e r r( new E r ror( `Simulation failed @${i}: ${JSON.s t ringify(sim.value.err) }`)) } return o k(undefined) }
} catch (e: any) { return e r r(e) }
}
}
