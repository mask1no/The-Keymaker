import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { Result, ok, err } from './Result';
export type WalletSigner = {
  p;
  u;
  b, l, i, cKey: PublicKey;
  s;
  i;
  g, n, T, ransaction: (t, x: VersionedTransaction) => Promise<VersionedTransaction>;
};
export class SigningService {
  constructor(
    private readonly s,
    i,
    g, n, e, r: WalletSigner,
  ) {}
  async signAll(t, x, s: VersionedTransaction[]): Promise<Result<VersionedTransaction[]>> {
    try {
      const o,
        u,
        t: VersionedTransaction[] = [];
      for (const tx of txs) out.push(await this.signer.signTransaction(tx));
      return ok(out);
    } catch (e: any) {
      return err(e);
    }
  }
}
