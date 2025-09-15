#!/usr/bin/env tsx

/**
 * Test token information and bundle creation
 * Usage: pnpm tsx scripts/testToken.ts
 */

import { Connection, PublicKey } from '@solana/web3.js'
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'

const TOKEN_MINT = '8ubE6HzPM3cq6Gf6foJ6pCimxViqJyxa1KzLdCVE7zc9'
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'

async function checkToken() {
  console.log('🔍 Checking token:', TOKEN_MINT)
  console.log('-------------------------------------------\n')

  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    const mintPubkey = new PublicKey(TOKEN_MINT)

    // Try to get mint info
    try {
      const mintInfo = await getMint(connection, mintPubkey)
      console.log('✅ Valid SPL Token Found!')
      console.log('📊 Token Details:')
      console.log(`   - Decimals: ${mintInfo.decimals}`)
      console.log(`   - Supply: ${mintInfo.supply.toString()}`)
      console.log(
        `   - Mint Authority: ${mintInfo.mintAuthority?.toBase58() || 'None (Renounced)'}`,
      )
      console.log(
        `   - Freeze Authority: ${mintInfo.freezeAuthority?.toBase58() || 'None'}`,
      )
      console.log('')

      // Check if it's on Pump.fun (usually has 6 or 9 decimals and large supply)
      if (mintInfo.decimals === 6 || mintInfo.decimals === 9) {
        const supplyNum =
          Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)
        if (supplyNum >= 1000000) {
          console.log('🎮 Likely a Pump.fun or meme token')
        }
      }

      console.log('\n📦 To create a buy bundle for this token:')
      console.log('-------------------------------------------')
      console.log('1. Go to the Bundle page in your app')
      console.log('2. Set up your wallets and fund them')
      console.log('3. Use this token mint:', TOKEN_MINT)
      console.log('4. Configure your buy amounts and slippage')
      console.log('5. Execute the bundle!')

      console.log('\n🔗 View on explorers:')
      console.log(`   Solscan: https://solscan.io/token/${TOKEN_MINT}`)
      console.log(
        `   Solana Explorer: https://explorer.solana.com/address/${TOKEN_MINT}`,
      )
      console.log(`   Birdeye: https://birdeye.so/token/${TOKEN_MINT}`)

      // Try to get price info from Jupiter
      console.log('\n💰 Checking price info...')
      try {
        const priceResponse = await fetch(
          `https://quote-api.jup.ag/v6/price?ids=${TOKEN_MINT}`,
        )
        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          if (priceData.data && priceData.data[TOKEN_MINT]) {
            const price = priceData.data[TOKEN_MINT].price
            console.log(`   Current Price: $${price}`)
          }
        }
      } catch (e) {
        console.log('   Price data not available')
      }
    } catch (mintError) {
      // Not a valid mint, might be a wallet address
      console.log('❌ Not a valid SPL token mint')
      console.log('   This might be a wallet address instead')

      // Check if it's a wallet
      const balance = await connection.getBalance(mintPubkey)
      if (balance > 0) {
        console.log(`\n👛 This appears to be a wallet address`)
        console.log(`   Balance: ${balance / 1e9} SOL`)
      }
    }
  } catch (error) {
    console.error('Error checking token:', error)
  }
}

// Run the check
checkToken().catch(console.error)
