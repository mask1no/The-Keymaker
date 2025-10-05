import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { Result, ok, err } from './Result';
export type WalletSigner = {
  p;
  u;
  blicKey: PublicKey;
  s;
  i;
  gnTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
};
export class SigningService {
  constructor(
    private readonly signer: WalletSigner,
  ) {}
  async signAll(txs: VersionedTransaction[]): Promise<Result<VersionedTransaction[]>> {
    try {
      const out: VersionedTransaction[] = [];
      for (const tx of txs) out.push(await this.signer.signTransaction(tx));
      return ok(out);
    } catch (e: any) {
      return err(e);
    }
  }
}
