#!/usr/bin/env tsx
import { Connection, Keypair, PublicKey, VersionedTransaction, TransactionMessage, SystemProgram } from '@solana/web3.js'
import bs58 from 'bs58'
const RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
const JITO = (process.env.JITO_RPC_URL || process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'https://mainnet.block-engine.jito.wtf').replace(/\/$/,'') + '/api/v1/bundles'
const TIP = new PublicKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe')

async function main() {
  if (!process.env.SMOKE_SECRET) throw new Error('Set SMOKE_SECRET (bs58 private key)')
  const kp = Keypair.fromSecretKey(bs58.decode(process.env.SMOKE_SECRET))
  const conn = new Connection(RPC, 'confirmed')
  const { blockhash } = await conn.getLatestBlockhash('confirmed')

  const vtx = (ixs:any[]) => {
    const msg = new TransactionMessage({ payerKey: kp.publicKey, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message()
    const tx = new VersionedTransaction(msg); tx.sign([kp]); return tx
  }

  const tx1 = vtx([SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: kp.publicKey, lamports: 0 })])
  const tx2 = vtx([SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: TIP, lamports: 2000 })]) // tip ≥ 1000

  const encodedTransactions = [tx1, tx2].map(t => Buffer.from(t.serialize()).toString('base64'))
  const body = { jsonrpc:'2.0', id: Date.now(), method:'sendBundle', params:[{ encodedTransactions, bundleOnly: true }] }

  const res = await fetch(JITO, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(await res.text())
  const jr = await res.json()
  const bundleId = jr?.result || jr?.bundle_id
  console.log('bundleId:', bundleId)

  // Poll status
  const statusReq = { jsonrpc:'2.0', id: Date.now()+1, method:'getBundleStatuses', params:[[bundleId]] }
  for (let i=0;i<20;i++){
    const s = await fetch(JITO, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(statusReq), signal: AbortSignal.timeout(8000) })
    const js = await s.json()
    const v = js?.result?.value?.[0]
    console.log('status:', v?.status, 'slot:', v?.landed_slot)
    if (v?.status === 'Landed' || v?.status === 'Invalid' || v?.status === 'Failed') break
    await new Promise(r=>setTimeout(r,1500))
  }
}
main().catch(e => { console.error(e); process.exit(1) })
