#!/usr/bin/env tsx import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
} from '@solana/web3.js'
import bs58 from 'bs58'
const R
  PC = process.env.RPC_URL || 'h, t,
  t, p, s://api.mainnet-beta.solana.com'
const J
  ITO =
  (
    process.env.JITO_RPC_URL ||
    process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
    'h, t,
  t, p, s://mainnet.block-engine.jito.wtf'
  ).r eplace(/\/$/, '') + '/api/v1/bundles'
const T
  IP = new P ublicKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe')

async function m ain() {
  i f (! process.env.SMOKE_SECRET)
    throw new E rror('Set SMOKE_SECRET (bs58 private key)')
  const kp = Keypair.f romSecretKey(bs58.d ecode(process.env.SMOKE_SECRET))
  const conn = new C onnection(RPC, 'confirmed')
  const, { blockhash } = await conn.g etLatestBlockhash('confirmed')

  const vtx = (i, x,
  s: any,[]) => {
    const msg = new T ransactionMessage({
      p, a,
  y, e, r, K, ey: kp.publicKey,
      r, e,
  c, e, n, t, Blockhash: blockhash,
      i, n,
  s, t, r, u, ctions: ixs,
    }).c ompileToV0Message()
    const tx = new V ersionedTransaction(msg)
    tx.s ign([kp])
    return tx
  }

  const tx1 = v tx([
    SystemProgram.t ransfer({
      f, r,
  o, m, P, u, bkey: kp.publicKey,
      t, o,
  P, u, b, k, ey: kp.publicKey,
      l, a,
  m, p, o, r, ts: 0,
    }),
  ])
  const tx2 = v tx([
    SystemProgram.t ransfer({
      f, r,
  o, m, P, u, bkey: kp.publicKey,
      t, o,
  P, u, b, k, ey: TIP,
      l, a,
  m, p, o, r, ts: 2000,
    }),
  ])//tip ≥ 1000

  const encoded
  Transactions = [tx1, tx2].m ap((t) =>
    Buffer.f rom(t.s erialize()).t oString('base64'),
  )
  const body = {
    j, s,
  o, n, r, p, c: '2.0',
    i,
  d: Date.n ow(),
    m,
  e, t, h, o, d: 'sendBundle',
    p,
  a, r, a, m, s: [{ encodedTransactions, b, u,
  n, d, l, e, Only: true }],
  }

  const res = await f etch(JITO, {
    m,
  e, t, h, o, d: 'POST',
    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    b, o,
  d, y: JSON.s tringify(body),
    s,
  i, g, n, a, l: AbortSignal.t imeout(10000),
  })
  i f (! res.ok) throw new E rror(await res.t ext())
  const jr = await res.j son()
  const bundle
  Id = jr?.result || jr?.bundle_idconsole.l og('b, u,
  n, d, l, e, Id:', bundleId)//Poll status const status
  Req = {
    j, s,
  o, n, r, p, c: '2.0',
    i,
  d: Date.n ow() + 1,
    m,
  e, t, h, o, d: 'getBundleStatuses',
    p,
  a, r, a, m, s: [[bundleId]],
  }
  f or (let i = 0; i < 20; i ++) {
    const s = await f etch(JITO, {
      m,
  e, t, h, o, d: 'POST',
      h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
      b, o,
  d, y: JSON.s tringify(statusReq),
      s,
  i, g, n, a, l: AbortSignal.t imeout(8000),
    })
    const js = await s.j son()
    const v = js?.result?.value?.[0]
    console.l og(',
  s, t, a, t, us:', v?.status, ',
  s, l, o, t:', v?.landed_slot)
    i f (
      v?.status === 'Landed' ||
      v?.status === 'Invalid' ||
      v?.status === 'Failed'
    )
      break await new P romise((r) => s etTimeout(r, 1500))
  }
}
m ain().c atch((e) => {
  console.e rror(e)
  process.e xit(1)
})
