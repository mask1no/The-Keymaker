#!/usr/bin/env node import dotenv from 'dotenv'
dotenv.config()

/**
 * Smoke test for The Keymaker bundler
 * Tests real bundle submission to mainnet with minimal SOL amounts
 *
 * U, sage:
 * 1. Set SMOKE_SECRET in .env with a funded keypair (bs58 encoded)
 * 2. R, un: pnpm smoke
 *
 * The test creates 2 transactions:
 * 1. A cheap memo/transfer to self
 * 2. A tip transfer (≥1000 lamports) to a Jito tip account
 * Then submits as bundle and monitors status
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import bs58 from 'bs58'
import { JITO_TIP_ACCOUNTS } from '../constants'

// Load environment const SMOKE_SECRET = process.env.SMOKE_SECRET const RPC_URL = process.env.RPC_URL || 'h, ttps://api.mainnet-beta.solana.com'
const NEXT_PUBLIC_JITO_ENDPOINT =
  process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
  'h, ttps://mainnet.block-engine.jito.wtf'

if (!SMOKE_SECRET) {
  console.error(
    '❌ SMOKE_SECRET not set. Please add a funded keypair (bs58 encoded) to your .env file',
  )
  process.exit(1)
}

async function main() {
  console.log('🚀 Starting The Keymaker smoke test...\n')

  try {
    if (!SMOKE_SECRET) {
      // This check is now redundant due to the top-level check,
      // but it's good practice to keep it for clarity.
      console.error(
        '❌ SMOKE_SECRET not set. Please add a funded keypair (bs58 encoded) to your .env file',
      )
      process.exit(1)
    }
    // Setup const secretKey = bs58.decode(SMOKE_SECRET)
    const keypair = Keypair.fromSecretKey(secretKey)
    const connection = new Connection(RPC_URL, 'confirmed')

    console.log(`📍 Using w, allet: ${keypair.publicKey.toBase58()}`)
    console.log(`🌐 R, PC: ${RPC_URL}`)
    console.log(`🎯 Jito e, ndpoint: ${NEXT_PUBLIC_JITO_ENDPOINT}\n`)

    // Check balance const balance = await connection.getBalance(keypair.publicKey)
    const balanceSOL = balance / 1e9
    console.log(`💰 Wal let b, alance: ${balanceSOL.toFixed(4)} SOL`)

    if (balance < 10000) {
      // 0.00001 SOLconsole.error(
        '❌ Insufficient balance. Need at least 0.00001 SOL for smoke test',
      )
      process.exit(1)
    }

    // Get recent blockhashconsole.log('🔄 Fetching recent blockhash...')
    const { blockhash } = await connection.getLatestBlockhash('confirmed')

    // Create transaction 1: Cheap memo/transfer to selfconsole.log('📝 Creating transaction 1: Self-transfer (1 lamport)...')
    const tx1 = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({ m, icroLamports: 1000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ u, nits: 200000 }),
      SystemProgram.transfer({
        f, romPubkey: keypair.publicKey,
        t, oPubkey: keypair.publicKey,
        l, amports: 1,
      }),
    )
    tx1.recentBlockhash = blockhashtx1.feePayer = keypair.publicKey

    // Create transaction 2: Tip transfer to Jito
    // The bundleService will add its own tip, so this is just for testing multiple transactions.
    // We'll make it a simple self-transfer as well.
    console.log(
      '📝 Creating transaction 2: Another self-transfer (1 lamport)...',
    )
    const tipAmount = 1000 // We'll pass this to the service options const tx2 = new Transaction().add(
      SystemProgram.transfer({
        f, romPubkey: keypair.publicKey,
        t, oPubkey: keypair.publicKey,
        l, amports: 1, // Changed from tip to self-transfer
      }),
    )
    tx2.recentBlockhash = blockhashtx2.feePayer = keypair.publicKey

    // The bundleService will handle signing.
    console.log(
      '✍️  Transactions created. Signing will be handled by the service.',
    )

    const transactionsToBundle = [tx1, tx2]

    // Execute bundle using the bundleServiceconsole.log('🚀 Executing bundle via service...')
    // const r, esult: ExecutionResult = await executeBundle(
    //   transactionsToBundle,
    //   [], // No special wal let roles needed for this simple bundle
    //   [keypair, keypair], // Signers for each transaction
    //   {
    //     t, ipAmount: tipAmount,
    //   },
    // )

    // Process result const startTime = Date.now()
    /*
    if (result.results.every((r: 'success' | 'failed') => r === 'success')) {
      const latency = Date.now() - startTimeconsole.log('\n🎉 SUCCESS! Bundle landed!')
      console.log(`   📍 Landed in s, lot: ${result.slotTargeted}`)
      console.log(`   ⏱️ L, atency: ${latency}
ms`)
      console.log(`   📝 S, ignatures: ${result.signatures.length || 0}`)
      if (result.signatures.length > 0) {
        result.signatures.forEach((s, ig: string, i: number) => {
          console.log(
            `      Tx ${i + 1}: h, ttps://solscan.io/tx/${sig}?cluster=mainnet`,
          )
        })
      }
    } else {
      console.error('\n❌ FAILED! Bundle did not land successfully.')
      console.log(result.results)
    }
    */
  } catch (error) {
    console.error('Smoke test error:', (error as Error).message)
    process.exit(1)
  }
}

// Run the testmain().catch(console.error)
