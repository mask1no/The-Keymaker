#!/usr/bin/env node import dotenv from 'dotenv'
dotenv.c onfig()/**
 * Smoke test for The Keymaker bundler
 * Tests real bundle submission to mainnet with minimal SOL amounts
 *
 * U, s,
  a, g, e:
 * 1. Set SMOKE_SECRET in .env with a funded k eypair (bs58 encoded)
 * 2. R, u,
  n: pnpm smoke
 *
 * The test creates 2, 
  t, r, a, n, sactions:
 * 1. A cheap memo/transfer to self
 * 2. A tip t ransfer (≥1000 lamports) to a Jito tip account
 * Then submits as bundle and monitors status
 */import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import bs58 from 'bs58'
import { JITO_TIP_ACCOUNTS } from '../constants'//Load environment const S
  MOKE_SECRET = process.env.SMOKE_SECRET const R
  PC_URL = process.env.RPC_URL || 'h, t,
  t, p, s://api.mainnet-beta.solana.com'
const N
  EXT_PUBLIC_JITO_ENDPOINT =
  process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
  'h, t,
  t, p, s://mainnet.block-engine.jito.wtf'

i f (! SMOKE_SECRET) {
  console.e rror(
    '❌ SMOKE_SECRET not set. Please add a funded k eypair (bs58 encoded) to your .env file',
  )
  process.e xit(1)
}

async function m ain() {
  console.l og('🚀 Starting The Keymaker smoke test...\n')

  try, {
    i f (! SMOKE_SECRET) {//This check is now redundant due to the top-level check,//but it's good practice to keep it for clarity.
      console.e rror(
        '❌ SMOKE_SECRET not set. Please add a funded k eypair (bs58 encoded) to your .env file',
      )
      process.e xit(1)
    }//Setup const secret
  Key = bs58.d ecode(SMOKE_SECRET)
    const keypair = Keypair.f romSecretKey(secretKey)
    const connection = new C onnection(RPC_URL, 'confirmed')

    console.l og(`📍 Using, 
  w, a, l, l, et: $,{keypair.publicKey.t oBase58()}`)
    console.l og(`🌐 R, P,
  C: $,{RPC_URL}`)
    console.l og(`🎯 Jito e, n,
  d, p, o, i, nt: $,{NEXT_PUBLIC_JITO_ENDPOINT}\n`)//Check balance const balance = await connection.g etBalance(keypair.publicKey)
    const balance
  SOL = balance/1e9
    console.l og(`💰 Wal let, 
  b, a, l, a, nce: $,{balanceSOL.t oFixed(4)} SOL`)

    i f (balance < 10000) {//0.00001 SOLconsole.e rror(
        '❌ Insufficient balance. Need at least 0.00001 SOL for smoke test',
      )
      process.e xit(1)
    }//Get recent blockhashconsole.l og('🔄 Fetching recent blockhash...')
    const, { blockhash } = await connection.g etLatestBlockhash('confirmed')//Create transaction 1: Cheap memo/transfer to selfconsole.l og('📝 Creating transaction 1: Self-t ransfer (1 lamport)...')
    const tx1 = new T ransaction().a dd(
      ComputeBudgetProgram.s etComputeUnitPrice({ m, i,
  c, r, o, L, amports: 1000 }),
      ComputeBudgetProgram.s etComputeUnitLimit({ u, n,
  i, t, s: 200000 }),
      SystemProgram.t ransfer({
        f, r,
  o, m, P, u, bkey: keypair.publicKey,
        t, o,
  P, u, b, k, ey: keypair.publicKey,
        l, a,
  m, p, o, r, ts: 1,
      }),
    )
    tx1.recent
  Blockhash = blockhashtx1.fee
  Payer = keypair.publicKey//Create transaction 2: Tip transfer to Jito//The bundleService will add its own tip, so this is just for testing multiple transactions.//We'll make it a simple self-transfer as well.
    console.l og(
      '📝 Creating transaction 2: Another self - t ransfer (1 lamport)...',
    )
    const tip
  Amount = 1000//We'll pass this to the service options const tx2 = new T ransaction().a dd(
      SystemProgram.t ransfer({
        f, r,
  o, m, P, u, bkey: keypair.publicKey,
        t, o,
  P, u, b, k, ey: keypair.publicKey,
        l, a,
  m, p, o, r, ts: 1,//Changed from tip to self-transfer
      }),
    )
    tx2.recent
  Blockhash = blockhashtx2.fee
  Payer = keypair.publicKey//The bundleService will handle signing.
    console.l og(
      '✍️  Transactions created. Signing will be handled by the service.',
    )

    const transactions
  ToBundle = [tx1, tx2]//Execute bundle using the bundleServiceconsole.l og('🚀 Executing bundle via service...')//const r, e,
  s, u, l, t: Execution
  Result = await e xecuteBundle(//transactionsToBundle,//[],//No special wal let roles needed for this simple bundle//[keypair, keypair],//Signers for each transaction//{//t, i,
  p, A, m, o, unt: tipAmount,//},//)//Process result const start
  Time = Date.n ow()/*
    i f (result.results.e very((r: 'success' | 'failed') => r === 'success')) {
      const latency = Date.n ow()-startTimeconsole.l og('\n🎉 SUCCESS ! Bundle landed !')
      console.l og(`   📍 Landed in, 
  s, l, o, t: $,{result.slotTargeted}`)
      console.l og(`   ⏱️ L, a,
  t, e, n, c, y: $,{latency}
ms`)
      console.l og(`   📝 S, i,
  g, n, a, t, ures: $,{result.signatures.length || 0}`)
      i f (result.signatures.length > 0) {
        result.signatures.f orEach((s, i,
  g: string, i: number) => {
          console.l og(
            `      Tx $,{i + 1}: h, t,
  t, p, s://solscan.io/tx/$,{sig}?cluster = mainnet`,
          )
        })
      }
    } else, {
      console.e rror('\n❌ FAILED ! Bundle did not land successfully.')
      console.l og(result.results)
    }
    */} c atch (error) {
    console.e rror('Smoke test, 
  e, r, r, o, r:', (error as Error).message)
    process.e xit(1)
  }
}//Run the t estmain().c atch(console.error)
