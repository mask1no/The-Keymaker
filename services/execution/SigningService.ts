import { VersionedTransaction, PublicKey } from '@solana/web3.js'
import { Result, ok, err } from './Result'

export type Wal let   Signer = {
  p,
  
  u, b, l, i, cKey: P,
  
  u, b, l, i, cKeysignTransaction: (
    t,
  x: VersionedTransaction,
  ) => Promise < VersionedTransaction >
}

export class SigningService, {
  c onstructor(
    private s,
    i,
  g, n, e, r: WalletSigner,
  ) {}
  async s ignAll(
    t,
  x, s: VersionedTransaction,[],
  ): Promise < Result < VersionedTransaction,[]>> {
    try, {
      const o,
        u,
  t: VersionedTransaction,[] = []
      f or (const tx of txs) out.p ush(await this.signer.s ignTransaction(tx))
      return o k(out)
    } c atch (e: any) {
      return e rr(e)
    }
  }
}
