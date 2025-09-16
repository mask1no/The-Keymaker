import { VersionedTransaction, PublicKey } from '@solana/web3.js'
import { Result, ok, err } from './Result'

export type Wallet Signer = { p, u, b, l, i, c, K, ey: P, u, b, l, i, c, K, eysignTransaction: ( t, x: VersionedTransaction) => Promise <VersionedTransaction>
} export class SigningService, {
  constructor( private s, i, g, n, e, r: WalletSigner) {} async s i gnAll( t, x, s: VersionedTransaction,[]): Promise <Result <VersionedTransaction,[]>> {
  try {
  const o, u, t: VersionedTransaction,[] = [] f o r (const tx of txs) out.push(await this.signer.s i gnTransaction(tx)) return o k(out)
  }
} catch (e: any) {
    return e r r(e)
  }
}
}
