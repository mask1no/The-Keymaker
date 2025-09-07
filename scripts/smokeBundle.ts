#!/usr/bin/env tsx

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
  VersionedTransaction,
  TransactionMessage,
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

    // Convert to versioned transaction
    const messageV0_1 = new TransactionMessage({
      payerKey: keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: tx1.instructions,
    }).compileToV0Message()

    const vTx1 = new VersionedTransaction(messageV0_1)

    // Create transaction 2: Tip transfer to Jito
    console.log('💰 Creating transaction 2: Tip transfer (1000 lamports)...')
    const tipAccount = new PublicKey(JITO_TIP_ACCOUNTS[0]) // Use first tip account
    const tipAmount = 1000 // 1000 lamports = 0.000001 SOL

    const tx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: tipAccount,
        lamports: tipAmount,
      }),
    )

    const messageV0_2 = new TransactionMessage({
      payerKey: keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: tx2.instructions,
    }).compileToV0Message()

    const vTx2 = new VersionedTransaction(messageV0_2)

    // Sign both transactions
    console.log('✍️  Signing transactions...')
    vTx1.sign([keypair])
    vTx2.sign([keypair])

    // Base64 encode
    const txsB64 = [
      bs58.encode(vTx1.serialize()),
      bs58.encode(vTx2.serialize()),
    ]

    console.log('📦 Bundle created:')
    console.log(`   - TX 1: Self-transfer (1 lamport)`)
    console.log(
      `   - TX 2: Tip transfer (${tipAmount} lamports to ${tipAccount.toBase58()})`,
    )
    console.log(`   - Total cost: ~${(tipAmount + 5000) / 1e9} SOL\n`)

    // Submit bundle
    console.log('🚀 Submitting bundle...')
    const submitUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/bundles/submit`

    const submitBody = {
      txs_b64: txsB64,
      region: 'ffm',
      tip_lamports: tipAmount,
    }

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitBody),
    })

    if (!submitRes.ok) {
      const error = await submitRes.text()
      throw new Error(`Submit failed: ${submitRes.status} ${error}`)
    }

    const submitData = await submitRes.json()
    const bundleId = submitData.bundle_id

    if (!bundleId) {
      throw new Error('No bundle ID returned from submit')
    }

    console.log(`✅ Bundle submitted! ID: ${bundleId}\n`)

    // Poll status
    console.log('🔍 Monitoring bundle status...')

    const statusUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/bundles/status/batch`
    const startTime = Date.now()
    let attempts = 0
    const maxAttempts = 30 // 30 seconds

    while (attempts < maxAttempts) {
      attempts++

      const statusRes = await fetch(statusUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundle_ids: [bundleId],
          region: 'ffm',
        }),
      })

      if (!statusRes.ok) {
        console.warn(`⚠️  Status check failed: ${statusRes.status}`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      const statusData = await statusRes.json()
      const bundleStatus = statusData.statuses?.[0]

      if (!bundleStatus) {
        console.log(`⏳ Attempt ${attempts}/${maxAttempts}: No status yet`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      const { status, landed_slot, transactions } = bundleStatus

      console.log(`📊 Attempt ${attempts}/${maxAttempts}: Status = ${status}`)

      if (status === 'landed') {
        const latency = Date.now() - startTime
        console.log('\n🎉 SUCCESS! Bundle landed!')
        console.log(`   📍 Landed in slot: ${landed_slot}`)
        console.log(`   ⏱️  Latency: ${latency}ms`)
        console.log(`   📝 Transactions: ${transactions?.length || 0}`)
        if (transactions?.length > 0) {
          transactions.forEach((tx: string, i: number) => {
            console.log(`      TX ${i + 1}: https://solscan.io/tx/${tx}`)
          })
        }
        console.log('\n✅ Smoke test PASSED!')
        return
      }

      if (status === 'failed' || status === 'invalid') {
        console.log(`\n❌ Bundle ${status}!`)
        console.log('\n❌ Smoke test FAILED!')
        process.exit(1)
      }

      // Wait 1 second before next check
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log('\n⏰ Timeout reached - bundle still pending')
    console.log('\n⚠️  Smoke test INCONCLUSIVE (bundle may still land)')
    process.exit(1)
  } catch (error) {
    console.error('\n💥 Smoke test failed:', error)
    process.exit(1)
  }
}

// Run the test
main().catch(console.error)
