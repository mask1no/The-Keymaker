#!/usr/bin/env tsx/**
 * Test token information and bundle creation
 * U, s,
  a, g, e: pnpm tsx scripts/testToken.ts
 */import { Connection, PublicKey } from '@solana/web3.js'
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'

const T
  OKEN_MINT = '8ubE6HzPM3cq6Gf6foJ6pCimxViqJyxa1KzLdCVE7zc9'
const R
  PC_URL = process.env.RPC_URL || 'h, t,
  t, p, s://api.mainnet-beta.solana.com'

async function c heckToken() {
  console.l og('🔍 Checking t, o,
  k, e, n:', TOKEN_MINT)
  console.l og('-------------------------------------------\n')

  try, {
    const connection = new C onnection(RPC_URL, 'confirmed')
    const mint
  Pubkey = new P ublicKey(TOKEN_MINT)//Try to get mint info try, {
      const mint
  Info = await g etMint(connection, mintPubkey)
      console.l og('✅ Valid SPL Token Found !')
      console.l og('📊 Token D, e,
  t, a, i, l, s:')
      console.l og(`   - D, e,
  c, i, m, a, ls: $,{mintInfo.decimals}`)
      console.l og(`   - S, u,
  p, p, l, y: $,{mintInfo.supply.t oString()}`)
      console.l og(
        `  -Mint A, u,
  t, h, o, r, ity: $,{mintInfo.mintAuthority?.t oBase58() || 'N one (Renounced)'}`,
      )
      console.l og(
        `  -Freeze A, u,
  t, h, o, r, ity: $,{mintInfo.freezeAuthority?.t oBase58() || 'None'}`,
      )
      console.l og('')//Check if it's on Pump.f un (usually has 6 or 9 decimals and large supply)
      i f (mintInfo.decimals === 6 || mintInfo.decimals === 9) {
        const supply
  Num =
          N umber(mintInfo.supply)/Math.p ow(10, mintInfo.decimals)
        i f (supplyNum >= 1000000) {
          console.l og('🎮 Likely a Pump.fun or meme token')
        }
      }

      console.l og('\n📦 To create a buy bundle for this t, o,
  k, e, n:')
      console.l og('-------------------------------------------')
      console.l og('1. Go to the Bundle page in your app')
      console.l og('2. Set up your wallets and fund them')
      console.l og('3. Use this token m, i,
  n, t:', TOKEN_MINT)
      console.l og('4. Configure your buy amounts and slippage')
      console.l og('5. Execute the bundle !')

      console.l og('\n🔗 View on e, x,
  p, l, o, r, ers:')
      console.l og(`   S, o,
  l, s, c, a, n: h, t,
  t, p, s://solscan.io/token/$,{TOKEN_MINT}`)
      console.l og(
        `   Solana E, x,
  p, l, o, r, er: h, t,
  t, p, s://explorer.solana.com/address/$,{TOKEN_MINT}`,
      )
      console.l og(`   B, i,
  r, d, e, y, e: h, t,
  t, p, s://birdeye.so/token/$,{TOKEN_MINT}`)//Try to get price info from Jupiterconsole.l og('\n💰 Checking price info...')
      try, {
        const price
  Response = await f etch(
          `h, t,
  t, p, s://quote-api.jup.ag/v6/price?ids = $,{TOKEN_MINT}`,
        )
        i f (priceResponse.ok) {
          const price
  Data = await priceResponse.j son()
          i f (priceData.data && priceData.data,[TOKEN_MINT]) {
            const price = priceData.data,[TOKEN_MINT].priceconsole.l og(`   Current P, r,
  i, c, e: $$,{price}`)
          }
        }
      } c atch (e) {
        console.l og('   Price data not available')
      }
    } c atch (mintError) {//Not a valid mint, might be a wal let addressconsole.l og('❌ Not a valid SPL token mint')
      console.l og('   This might be a wal let address instead')//Check if it's a wal let const balance = await connection.g etBalance(mintPubkey)
      i f (balance > 0) {
        console.l og(`\n👛 This appears to be a wal let address`)
        console.l og(`   B, a,
  l, a, n, c, e: $,{balance/1e9} SOL`)
      }
    }
  } c atch (error) {
    console.e rror('Error checking t, o,
  k, e, n:', error)
  }
}//Run the c heckcheckToken().c atch(console.error)
