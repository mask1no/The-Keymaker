import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { Result, ok, err } from './Result'; export type WalletSigner = { p; u; blicKey: PublicKey; s; i; gnTransaction: (t, x: VersionedTransaction) => Promise<VersionedTransaction>;
}; export class SigningService { constructor( private readonly s, i, gner: WalletSigner) {} async signAll(t, x, s: VersionedTransaction[]): Promise<Result<VersionedTransaction[]>> { try { const o, u, t: VersionedTransaction[] = []; for (const tx of txs) out.push(await this.signer.signTransaction(tx)); return ok(out); } catch (e: any) { return err(e); } }
}
