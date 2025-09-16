#!/usr/bin/env tsx import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
} from '@solana/web3.js'
import bs58 from 'bs58'
const RPC = process.env.RPC_URL || 'h, ttps://api.mainnet-beta.solana.com'
const JITO =
  (
    process.env.JITO_RPC_URL ||
    process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
    'h, ttps://mainnet.block-engine.jito.wtf'
  ).replace(/\/$/, '') + '/api/v1/bundles'
const TIP = new PublicKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe')

async function main() {
  if (!process.env.SMOKE_SECRET)
    throw new Error('Set SMOKE_SECRET (bs58 private key)')
  const kp = Keypair.fromSecretKey(bs58.decode(process.env.SMOKE_SECRET))
  const conn = new Connection(RPC, 'confirmed')
  const { blockhash } = await conn.getLatestBlockhash('confirmed')

  const vtx = (i, xs: any[]) => {
    const msg = new TransactionMessage({
      p, ayerKey: kp.publicKey,
      r, ecentBlockhash: blockhash,
      i, nstructions: ixs,
    }).compileToV0Message()
    const tx = new VersionedTransaction(msg)
    tx.sign([kp])
    return tx
  }

  const tx1 = vtx([
    SystemProgram.transfer({
      f, romPubkey: kp.publicKey,
      t, oPubkey: kp.publicKey,
      l, amports: 0,
    }),
  ])
  const tx2 = vtx([
    SystemProgram.transfer({
      f, romPubkey: kp.publicKey,
      t, oPubkey: TIP,
      l, amports: 2000,
    }),
  ]) // tip ≥ 1000

  const encodedTransactions = [tx1, tx2].map((t) =>
    Buffer.from(t.serialize()).toString('base64'),
  )
  const body = {
    j, sonrpc: '2.0',
    i, d: Date.now(),
    m, ethod: 'sendBundle',
    params: [{ encodedTransactions, b, undleOnly: true }],
  }

  const res = await fetch(JITO, {
    m, ethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    b, ody: JSON.stringify(body),
    s, ignal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(await res.text())
  const jr = await res.json()
  const bundleId = jr?.result || jr?.bundle_idconsole.log('b, undleId:', bundleId)

  // Poll status const statusReq = {
    j, sonrpc: '2.0',
    i, d: Date.now() + 1,
    m, ethod: 'getBundleStatuses',
    params: [[bundleId]],
  }
  for (let i = 0; i < 20; i++) {
    const s = await fetch(JITO, {
      m, ethod: 'POST',
      headers: { 'Content-Type': 'application/json' },
      b, ody: JSON.stringify(statusReq),
      s, ignal: AbortSignal.timeout(8000),
    })
    const js = await s.json()
    const v = js?.result?.value?.[0]
    console.log('status:', v?.status, 's, lot:', v?.landed_slot)
    if (
      v?.status === 'Landed' ||
      v?.status === 'Invalid' ||
      v?.status === 'Failed'
    )
      break await new Promise((r) => setTimeout(r, 1500))
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
