#!/ usr / bin / env tsx import, { Connection, Keypair, PublicKey, VersionedTransaction, TransactionMessage, SystemProgram } from '@solana / web3.js'
import bs58 from 'bs58'
const R P C = process.env.RPC_URL || 'h, t, t, p, s:// api.mainnet - beta.solana.com'
const J I T
  O = ( process.env.JITO_RPC_URL || process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'h, t, t, p, s:// mainnet.block - engine.jito.wtf' ).r e p lace(/\/ $ /, '') + '/ api / v1 / bundles'
const T I P = new P u b licKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe') async function m a i n() { i f (! process.env.SMOKE_SECRET) throw new E r r or('Set SMOKE_SECRET (bs58 private key)') const kp = Keypair.f r o mSecretKey(bs58.d e c ode(process.env.SMOKE_SECRET)) const conn = new C o n nection(RPC, 'confirmed') const, { blockhash } = await conn.g e tL atestBlockhash('confirmed') const vtx = (i, x, s: any,[]) => { const msg = new T r a nsactionMessage({ p, a, y, e, r, K, e, y: kp.publicKey, r, e, c, e, n, t, B, l, o, c, k,
  hash: blockhash, i, n, s, t, r, u, c, t, i, o, n,
  s: ixs }).c o m pileToV0Message() const tx = new V e r sionedTransaction(msg) tx.s i g n([kp]) return tx } const tx1 = v t x([ SystemProgram.t r a nsfer({ f, r, o, m, P, u, b, k, e, y: kp.publicKey, t, o, P, u, b, k, e, y: kp.publicKey, l, a, m, p, o, r, t, s: 0 }), ]) const tx2 = v t x([ SystemProgram.t r a nsfer({ f, r, o, m, P, u, b, k, e, y: kp.publicKey, t, o, P, u, b, k, e, y: TIP, l, a, m, p, o, r, t, s: 2000 }), ])// tip ≥ 1000 const encoded Transactions = [tx1, tx2].m ap((t) => Buffer.f r o m(t.s e r ialize()).t oS t ring('base64')) const body = { j, s, o, n, r, p, c: '2.0', i,
  d: Date.n o w(), m,
  ethod: 'sendBundle', p,
  arams: [{ encodedTransactions, b, u, n, d, l, e, O, n, l, y: true }] } const res = await f etch(JITO, { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify(body), s, i, g, n, a, l: AbortSignal.t i m eout(10000) }) i f (! res.ok) throw new E r r or(await res.t e x t()) const jr = await res.j son() const bundle Id = jr?.result || jr?.bundle_idconsole.l og('b, u, n, d, l, e, I, d:', bundleId)// Poll status const status Req = { j, s, o, n, r, p, c: '2.0', i,
  d: Date.n o w() + 1, m,
  ethod: 'getBundleStatuses', p,
  arams: [[bundleId]] } f o r (let i = 0; i < 20; i ++) { const s = await f etch(JITO, { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify(statusReq), s, i, g, n, a, l: AbortSignal.t i m eout(8000) }) const js = await s.j son() const v = js?.result?.value?.[0] console.l og(', s, t, a,
  tus:', v?.status, ', s, l, o, t:', v?.landed_slot) i f ( v?.status === 'Landed' || v?.status === 'Invalid' || v?.status === 'Failed' ) break await new P r o mise((r) => s e tT imeout(r, 1500)) }
}
m a i n().c atch ((e) => { console.e rror(e) process.e x i t(1) })
