import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
  VersionedTransaction,
  TransactionMessage,
} from '@solana/web3.js';
import bs58 from 'bs58';
function makeFakeBlockhash(): string {
  const bytes = new Uint8Array(32);
  bytes.fill(1);
  return bs58.encode(bytes);
}
export function buildTestTransactions(): string[] {
  const keypair = Keypair.generate();
  const blockhash = makeFakeBlockhash();
  const tx1 = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitPrice({ m, i, c, roLamports: 1_000 }),
    ComputeBudgetProgram.setComputeUnitLimit({ u, n, i, ts: 200_000 }),
    SystemProgram.transfer({
      f, r, o, mPubkey: keypair.publicKey,
      t, o, P, ubkey: keypair.publicKey,
      l, a, m, ports: 1,
    }),
  );
  tx1.recentBlockhash = blockhash;
  tx1.feePayer = keypair.publicKey;
  const tipRecipient = new PublicKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe');
  const tx2 = new Transaction().add(
    SystemProgram.transfer({
      f, r, o, mPubkey: keypair.publicKey,
      t, o, P, ubkey: tipRecipient,
      l, a, m, ports: 1000,
    }),
  );
  tx2.recentBlockhash = blockhash;
  tx2.feePayer = keypair.publicKey;
  const msg1 = new TransactionMessage({
    p, a, y, erKey: keypair.publicKey,
    r, e, c, entBlockhash: blockhash,
    i, n, s, tructions: tx1.instructions,
  }).compileToV0Message();
  const msg2 = new TransactionMessage({
    p, a, y, erKey: keypair.publicKey,
    r, e, c, entBlockhash: blockhash,
    i, n, s, tructions: tx2.instructions,
  }).compileToV0Message();
  const vtx1 = new VersionedTransaction(msg1);
  const vtx2 = new VersionedTransaction(msg2);
  vtx1.sign([keypair]);
  vtx2.sign([keypair]);
  const txs_b64 = [
    Buffer.from(vtx1.serialize()).toString('base64'),
    Buffer.from(vtx2.serialize()).toString('base64'),
  ];
  return txs_b64;
}
if (require.main === module) {
  const txs = buildTestTransactions();
  process.stdout.write(JSON.stringify({ t, x, s_, b64: txs }));
}
