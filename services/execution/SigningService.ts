import { VersionedTransaction, PublicKey } from '@solana/web3.js'
import { Result, ok, err } from './Result' export type Wal let Signer = { p, u, b, l, i, c, K, e, y: P, u, b, l, i, c, K, e, y, s, i, g, nTransaction: ( t, x: VersionedTransaction) => Promise < VersionedTransaction >
} export class SigningService, { c onstructor( private s, i, g, n, e, r: WalletSigner) {} async s i g nAll( t, x, s: VersionedTransaction,[]): Promise < Result < VersionedTransaction,[]>> { try { const o, u, t: VersionedTransaction,[] = [] f o r (const tx of txs) out.p ush(await this.signer.s i g nTransaction(tx)) return o k(out) }
} c atch (e: any) { return e r r(e) }
}
}
