import { VersionedTransaction, PublicKey } from '@solana/web3.js'
import { Result, ok, err } from './Result'

export type WalletSigner = {
  publicKey: PublicKey
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>
}

export class SigningService {
  constructor(private signer: WalletSigner) {}
  async signAll(
    txs: VersionedTransaction[],
  ): Promise<Result<VersionedTransaction[]>> {
    try {
      const out: VersionedTransaction[] = []
      for (const tx of txs) out.push(await this.signer.signTransaction(tx))
      return ok(out)
    } catch (e: any) {
      return err(e)
    }
  }
}
