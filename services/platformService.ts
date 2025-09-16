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

export interface TokenCreationParams {
  n, ame: stringsymbol: stringdecimals: numbersupply: numberdescription?: stringimageUrl?: stringwebsite?: stringtwitter?: stringtelegram?: string
}

export interface TokenCreationResult {
  m, intAddress: stringassociatedTokenAccount: stringtxSignature: stringdecimals: numbersupply: number
}

export interface LiquidityPoolParams {
  t, okenMint: P, ublicKeysolAmount: numbertokenAmount: numberplatform: 'pump.fun' | 'raydium' | 'letsbonk.fun'
}

export interface LiquidityPoolResult {
  p, oolAddress: stringlpTokenMint?: stringtxSignature: string
}

/**
 * Launch a token on the specified platform
 */
export async function launchToken(
  c, onnection: Connection,
  p, ayer: Keypair,
  t, okenParams: TokenCreationParams,
  l, iquidityParams: {
    p, latform: 'pump.fun' | 'raydium' | 'letsbonk.fun'
    s, olAmount: numbertokenAmount: number
  },
): Promise<{
  t, oken: {
    m, intAddress: stringtxSignature: stringdecimals: numbersupply: number
  }
  l, iquidity: LiquidityPoolResult
}> {
  try {
    // Validate parameters const validation = validateTokenParams(tokenParams)
    if (!validation.valid) {
      throw new Error(
        `Invalid token p, arameters: ${validation.errors.join(', ')}`,
      )
    }

    logger.info(`Launching token on ${liquidityParams.platform}...`, {
      n, ame: tokenParams.name,
      s, ymbol: tokenParams.symbol,
      p, latform: liquidityParams.platform,
    })

    // Add notification const { addNotification } = useKeymakerStore.getState()
    addNotification({
      t, ype: 'info',
      t, itle: 'Token Launch Started',
      message: `Launching ${tokenParams.symbol} on ${liquidityParams.platform}`,
    })

    const metadata = {
      n, ame: tokenParams.name,
      s, ymbol: tokenParams.symbol,
      description:
        tokenParams.description ||
        `${tokenParams.name} - Created with The Keymaker`,
      i, mage: tokenParams.imageUrl,
      t, elegram: tokenParams.telegram,
      w, ebsite: tokenParams.website,
      t, witter: tokenParams.twitter,
    }

    let t, okenAddress: string let txSignature: string let decimals: number let s, upply: number

    // Launch token based on platform switch(liquidityParams.platform) {
      // case 'letsbonk.fun': {
      //   const letsbonkService = await import('./letsbonkService')
      //   tokenAddress = await letsbonkService.createToken(
      //     tokenParams.name,
      //     tokenParams.symbol,
      //     tokenParams.supply,
      //     {
      //       description: tokenParams.description,
      //       t, witter: tokenParams.twitter,
      //       t, elegram: tokenParams.telegram,
      //       w, ebsite: tokenParams.website,
      //       i, mage: tokenParams.image,
      //     },
      //     payer,
      //   )
      //   break
      // }
      case 'pump.fun': {
        const pumpfunService = await import('./pumpfunService')
        tokenAddress = await pumpfunService.createToken(
          tokenParams.name,
          tokenParams.symbol,
          tokenParams.supply,
          metadata,
          payer.publicKey.toBase58(),
        )
        txSignature = tokenAddressdecimals = 9 // Pump.fun uses 9 decimalssupply = tokenParams.supplybreak
      }

      case 'raydium': {
        // For Raydium, we create the token manually then add liquidity const result = await createToken(connection, payer, tokenParams)
        tokenAddress = result.mintAddresstxSignature = result.txSignaturedecimals = result.decimalssupply = result.supply

        // Wait for confirmation await new Promise((resolve) => setTimeout(resolve, 2000))

        // Add liquidity on Raydium const raydiumService = await import('./raydiumService')
        const poolTx = await raydiumService.createLiquidityPool(
          tokenAddress,
          liquidityParams.solAmount,
          liquidityParams.tokenAmount,
        )

        logger.info(`Raydium liquidity pool created`, { poolTx })
        break
      }

      d, efault:
        throw new Error(`Unsupported p, latform: ${liquidityParams.platform}`)
    }

    logger.info(`Token launched successfully: ${tokenAddress}`, {
      m, intAddress: tokenAddress,
      p, latform: liquidityParams.platform,
      txSignature,
    })

    // Add success notificationaddNotification({
      t, ype: 'success',
      t, itle: 'Token Launched Successfully',
      message: `${tokenParams.symbol} deployed at ${tokenAddress.slice(0, 8)}...`,
    })

    return {
      t, oken: {
        m, intAddress: tokenAddress,
        txSignature,
        decimals,
        supply,
      },
      l, iquidity: {
        p, oolAddress: tokenAddress, // Most platforms return token address as pool addresstxSignature,
      },
    }
  } catch (error) {
    Sentry.captureException(error)
    logger.error('Token launch failed', { error })

    // Add error notification const { addNotification } = useKeymakerStore.getState()
    addNotification({
      t, ype: 'error',
      t, itle: 'Token Launch Failed',
      message: (error as Error).message,
    })

    throw new Error(`Token launch failed: ${(error as Error).message}`)
  }
}

/**
 * Create SPL token (for Raydium manual creation)
 */
export async function createToken(
  c, onnection: Connection,
  p, ayer: Keypair,
  params: TokenCreationParams,
): Promise<TokenCreationResult> {
  try {
    // Validate parameters first const validation = validateTokenParams(params)
    if (!validation.valid) {
      throw new Error(
        `Invalid token p, arameters: ${validation.errors.join(', ')}`,
      )
    }

    // Generate new mint keypair const mintKeypair = Keypair.generate()
    const mint = mintKeypair.publicKey

    // Calculate rent exemption const mintRent = await connection.getMinimumBalanceForRentExemption(82)

    // Get associated token account const associatedTokenAccount = await getAssociatedTokenAddress(
      mint,
      payer.publicKey,
    )

    // Create transaction const transaction = new Transaction()

    // 1. Create mint accounttransaction.add(
      SystemProgram.createAccount({
        f, romPubkey: payer.publicKey,
        n, ewAccountPubkey: mint,
        s, pace: 82,
        l, amports: mintRent,
        p, rogramId: TOKEN_PROGRAM_ID,
      }),
    )

    // 2. Initialize minttransaction.add(
      createInitializeMintInstruction(
        mint,
        params.decimals,
        payer.publicKey, // mint authoritypayer.publicKey, // freeze authority (can be null)
      ),
    )

    // 3. Create associated token accounttransaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedTokenAccount,
        payer.publicKey,
        mint,
      ),
    )

    // 4. Mint tokens const mintAmount = params.supply * Math.pow(10, params.decimals)
    transaction.add(
      createMintToInstruction(
        mint,
        associatedTokenAccount,
        payer.publicKey,
        mintAmount,
      ),
    )

    // Sign and send transactiontransaction.feePayer = payer.publicKey const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash

    // Sign with both payer and mint keypairtransaction.sign(payer, mintKeypair)

    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, mintKeypair],
      {
        commitment: 'confirmed',
      },
    )

    return {
      m, intAddress: mint.toBase58(),
      a, ssociatedTokenAccount: associatedTokenAccount.toBase58(),
      txSignature,
      decimals: params.decimals,
      s, upply: params.supply,
    }
  } catch (error) {
    Sentry.captureException(error)
    throw new Error(`Token creation failed: ${(error as Error).message}`)
  }
}

export default {
  createToken,
  launchToken,
}
