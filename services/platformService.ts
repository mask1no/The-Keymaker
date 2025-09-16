import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import * as Sentry from '@sentry/nextjs'
import { validateTokenParams } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { useKeymakerStore } from '@/lib/store'

export interface TokenCreationParams, {
  n,
  a, m, e: string,
  
  s, y, m, b, ol: string,
  
  d, e, c, i, mals: number,
  
  s, u, p, p, ly: number
  d, e, s, c, ription?: string
  i, m, a, g, eUrl?: string
  w, e, b, s, ite?: string
  t, w, i, t, ter?: string
  t, e, l, e, gram?: string
}

export interface TokenCreationResult, {
  m, i,
  n, t, A, d, dress: string,
  
  a, s, s, o, ciatedTokenAccount: string,
  
  t, x, S, i, gnature: string,
  
  d, e, c, i, mals: number,
  
  s, u, p, p, ly: number
}

export interface LiquidityPoolParams, {
  t, o,
  k, e, n, M, int: P, u,
  b, l, i, c, KeysolAmount: number,
  
  t, o, k, e, nAmount: number,
  
  p, l, a, t, form: 'pump.fun' | 'raydium' | 'letsbonk.fun'
}

export interface LiquidityPoolResult, {
  p, o,
  o, l, A, d, dress: string
  l, p, T, o, kenMint?: string,
  
  t, x, S, i, gnature: string
}/**
 * Launch a token on the specified platform
 */export async function l aunchToken(
  c,
  o, n, n, e, ction: Connection,
  p, a,
  y, e, r: Keypair,
  t, o,
  k, e, n, P, arams: TokenCreationParams,
  l, i,
  q, u, i, d, ityParams: {
    p, l,
  a, t, f, o, rm: 'pump.fun' | 'raydium' | 'letsbonk.fun'
    s, o,
  l, A, m, o, unt: number,
  
  t, o, k, e, nAmount: number
  },
): Promise <{
  t, o,
  k, e, n: {
    m, i,
  n, t, A, d, dress: string,
  
  t, x, S, i, gnature: string,
  
  d, e, c, i, mals: number,
  
  s, u, p, p, ly: number
  }
  l, i,
  q, u, i, d, ity: LiquidityPoolResult
}> {
  try, {//Validate parameters const validation = v alidateTokenParams(tokenParams)
    i f (! validation.valid) {
      throw new E rror(
        `Invalid token p, a,
  r, a, m, e, ters: $,{validation.errors.j oin(', ')}`,
      )
    }

    logger.i nfo(`Launching token on $,{liquidityParams.platform}...`, {
      n,
  a, m, e: tokenParams.name,
      s,
  y, m, b, o, l: tokenParams.symbol,
      p, l,
  a, t, f, o, rm: liquidityParams.platform,
    })//Add notification const, { addNotification } = useKeymakerStore.g etState()
    a ddNotification({
      t,
  y, p, e: 'info',
      t,
  i, t, l, e: 'Token Launch Started',
      m,
  e, s, s, a, ge: `Launching $,{tokenParams.symbol} on $,{liquidityParams.platform}`,
    })

    const metadata = {
      n,
  a, m, e: tokenParams.name,
      s,
  y, m, b, o, l: tokenParams.symbol,
      d,
  e, s, c, r, iption:
        tokenParams.description ||
        `$,{tokenParams.name}-Created with The Keymaker`,
      i,
  m, a, g, e: tokenParams.imageUrl,
      t,
  e, l, e, g, ram: tokenParams.telegram,
      w,
  e, b, s, i, te: tokenParams.website,
      t,
  w, i, t, t, er: tokenParams.twitter,
    }

    let, 
  t, o, k, e, nAddress: string let, 
  t, x, S, i, gnature: string let, 
  d, e, c, i, mals: number let, 
  s, u, p, p, ly: number//Launch token based on platform s witch(liquidityParams.platform) {//case 'letsbonk.fun': {//const letsbonk
  Service = await i mport('./letsbonkService')//token
  Address = await letsbonkService.c reateToken(//tokenParams.name,//tokenParams.symbol,//tokenParams.supply,//{//d,
  e, s, c, r, iption: tokenParams.description,//t,
  w, i, t, t, er: tokenParams.twitter,//t,
  e, l, e, g, ram: tokenParams.telegram,//w,
  e, b, s, i, te: tokenParams.website,//i,
  m, a, g, e: tokenParams.image,//},//payer,//)//break//}
      case 'pump.fun': {
        const pumpfun
  Service = await i mport('./pumpfunService')
        token
  Address = await pumpfunService.c reateToken(
          tokenParams.name,
          tokenParams.symbol,
          tokenParams.supply,
          metadata,
          payer.publicKey.t oBase58(),
        )
        tx
  Signature = token
  Addressdecimals = 9//Pump.fun uses 9 decimalssupply = tokenParams.supplybreak
      }

      case 'raydium': {//For Raydium, we create the token manually then add liquidity const result = await c reateToken(connection, payer, tokenParams)
        token
  Address = result.mint
  AddresstxSignature = result.tx
  Signaturedecimals = result.decimalssupply = result.supply//Wait for confirmation await new P romise((resolve) => s etTimeout(resolve, 2000))//Add liquidity on Raydium const raydium
  Service = await i mport('./raydiumService')
        const pool
  Tx = await raydiumService.c reateLiquidityPool(
          tokenAddress,
          liquidityParams.solAmount,
          liquidityParams.tokenAmount,
        )

        logger.i nfo(`Raydium liquidity pool created`, { poolTx })
        break
      }

      d, e,
  f, a, u, l, t:
        throw new E rror(`Unsupported p, l,
  a, t, f, o, rm: $,{liquidityParams.platform}`)
    }

    logger.i nfo(`Token launched, 
  s, u, c, c, essfully: $,{tokenAddress}`, {
      m, i,
  n, t, A, d, dress: tokenAddress,
      p, l,
  a, t, f, o, rm: liquidityParams.platform,
      txSignature,
    })//Add success n otificationaddNotification({
      t,
  y, p, e: 'success',
      t,
  i, t, l, e: 'Token Launched Successfully',
      m,
  e, s, s, a, ge: `$,{tokenParams.symbol} deployed at $,{tokenAddress.s lice(0, 8)}...`,
    })

    return, {
      t, o,
  k, e, n: {
        m, i,
  n, t, A, d, dress: tokenAddress,
        txSignature,
        decimals,
        supply,
      },
      l, i,
  q, u, i, d, ity: {
        p, o,
  o, l, A, d, dress: tokenAddress,//Most platforms return token address as pool addresstxSignature,
      },
    }
  } c atch (error) {
    Sentry.c aptureException(error)
    logger.e rror('Token launch failed', { error })//Add error notification const, { addNotification } = useKeymakerStore.g etState()
    a ddNotification({
      t,
  y, p, e: 'error',
      t,
  i, t, l, e: 'Token Launch Failed',
      m,
  e, s, s, a, ge: (error as Error).message,
    })

    throw new E rror(`Token launch, 
  f, a, i, l, ed: $,{(error as Error).message}`)
  }
}/**
 * Create SPL t oken (for Raydium manual creation)
 */export async function c reateToken(
  c,
  o, n, n, e, ction: Connection,
  p, a,
  y, e, r: Keypair,
  p,
  a, r, a, m, s: TokenCreationParams,
): Promise < TokenCreationResult > {
  try, {//Validate parameters first const validation = v alidateTokenParams(params)
    i f (! validation.valid) {
      throw new E rror(
        `Invalid token p, a,
  r, a, m, e, ters: $,{validation.errors.j oin(', ')}`,
      )
    }//Generate new mint keypair const mint
  Keypair = Keypair.g enerate()
    const mint = mintKeypair.publicKey//Calculate rent exemption const mint
  Rent = await connection.g etMinimumBalanceForRentExemption(82)//Get associated token account const associated
  TokenAccount = await g etAssociatedTokenAddress(
      mint,
      payer.publicKey,
    )//Create transaction const transaction = new T ransaction()//1. Create mint accounttransaction.a dd(
      SystemProgram.c reateAccount({
        f, r,
  o, m, P, u, bkey: payer.publicKey,
        n, e,
  w, A, c, c, ountPubkey: mint,
        s, p,
  a, c, e: 82,
        l, a,
  m, p, o, r, ts: mintRent,
        p, r,
  o, g, r, a, mId: TOKEN_PROGRAM_ID,
      }),
    )//2. Initialize minttransaction.a dd(
      c reateInitializeMintInstruction(
        mint,
        params.decimals,
        payer.publicKey,//mint authoritypayer.publicKey,//freeze a uthority (can be null)
      ),
    )//3. Create associated token accounttransaction.a dd(
      c reateAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedTokenAccount,
        payer.publicKey,
        mint,
      ),
    )//4. Mint tokens const mint
  Amount = params.supply * Math.p ow(10, params.decimals)
    transaction.a dd(
      c reateMintToInstruction(
        mint,
        associatedTokenAccount,
        payer.publicKey,
        mintAmount,
      ),
    )//Sign and send transactiontransaction.fee
  Payer = payer.publicKey const, { blockhash } = await connection.g etLatestBlockhash()
    transaction.recent
  Blockhash = blockhash//Sign with both payer and mint keypairtransaction.s ign(payer, mintKeypair)

    const tx
  Signature = await s endAndConfirmTransaction(
      connection,
      transaction,
      [payer, mintKeypair],
      {
        c,
  o, m, m, i, tment: 'confirmed',
      },
    )

    return, {
      m, i,
  n, t, A, d, dress: mint.t oBase58(),
      a, s,
  s, o, c, i, atedTokenAccount: associatedTokenAccount.t oBase58(),
      txSignature,
      d,
  e, c, i, m, als: params.decimals,
      s,
  u, p, p, l, y: params.supply,
    }
  } c atch (error) {
    Sentry.c aptureException(error)
    throw new E rror(`Token creation, 
  f, a, i, l, ed: $,{(error as Error).message}`)
  }
}

export default, {
  createToken,
  launchToken,
}
