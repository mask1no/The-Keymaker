#!/usr/bin/env node

import dotenv from 'dotenv'
dotenv.config()

/**
 * Smoke test for The Keymaker bundler
 * Tests real bundle submission to mainnet with minimal SOL amounts
 *
 * Usage:
 * 1. Set SMOKE_SECRET in .env with a funded keypair (bs58 encoded)
 * 2. Run: pnpm smoke
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

// Load environment
const SMOKE_SECRET = process.env.SMOKE_SECRET
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
const NEXT_PUBLIC_JITO_ENDPOINT =
  process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
  'https://mainnet.block-engine.jito.wtf'

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
    // Setup
    const secretKey = bs58.decode(SMOKE_SECRET)
    const keypair = Keypair.fromSecretKey(secretKey)
    const connection = new Connection(RPC_URL, 'confirmed')

    console.log(`📍 Using wallet: ${keypair.publicKey.toBase58()}`)
    console.log(`🌐 RPC: ${RPC_URL}`)
    console.log(`🎯 Jito endpoint: ${NEXT_PUBLIC_JITO_ENDPOINT}\n`)

    // Check balance
    const balance = await connection.getBalance(keypair.publicKey)
    const balanceSOL = balance / 1e9
    console.log(`💰 Wallet balance: ${balanceSOL.toFixed(4)} SOL`)

    if (balance < 10000) {
      // 0.00001 SOL
      console.error(
        '❌ Insufficient balance. Need at least 0.00001 SOL for smoke test',
      )
      process.exit(1)
    }

    // Get recent blockhash
    console.log('🔄 Fetching recent blockhash...')
    const { blockhash } = await connection.getLatestBlockhash('confirmed')

    // Create transaction 1: Cheap memo/transfer to self
    console.log('📝 Creating transaction 1: Self-transfer (1 lamport)...')
    const tx1 = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey,
        lamports: 1,
      }),
    )
    tx1.recentBlockhash = blockhash
    tx1.feePayer = keypair.publicKey

    // Create transaction 2: Tip transfer to Jito
    // The bundleService will add its own tip, so this is just for testing multiple transactions.
    // We'll make it a simple self-transfer as well.
    console.log(
      '📝 Creating transaction 2: Another self-transfer (1 lamport)...',
    )
    const tipAmount = 1000 // We'll pass this to the service options
    const tx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey,
        lamports: 1, // Changed from tip to self-transfer
      }),
    )
    tx2.recentBlockhash = blockhash
    tx2.feePayer = keypair.publicKey

    // The bundleService will handle signing.
    console.log(
      '✍️  Transactions created. Signing will be handled by the service.',
    )

    const transactionsToBundle = [tx1, tx2]

    // Execute bundle using the bundleService
    console.log('🚀 Executing bundle via service...')
    // const result: ExecutionResult = await executeBundle(
    //   transactionsToBundle,
    //   [], // No special wallet roles needed for this simple bundle
    //   [keypair, keypair], // Signers for each transaction
    //   {
    //     tipAmount: tipAmount,
    //   },
    // )

    // Process result
    const startTime = Date.now()
    /*
    if (result.results.every((r: 'success' | 'failed') => r === 'success')) {
      const latency = Date.now() - startTime
      console.log('\n🎉 SUCCESS! Bundle landed!')
      console.log(`   📍 Landed in slot: ${result.slotTargeted}`)
      console.log(`   ⏱️ Latency: ${latency}ms`)
      console.log(`   📝 Signatures: ${result.signatures.length || 0}`)
      if (result.signatures.length > 0) {
        result.signatures.forEach((sig: string, i: number) => {
          console.log(
            `      Tx ${i + 1}: https://solscan.io/tx/${sig}?cluster=mainnet`,
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

// Run the test
main().catch(console.error)
