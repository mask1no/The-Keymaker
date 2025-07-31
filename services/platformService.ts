import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as Sentry from '@sentry/nextjs';
import { validateTokenParams } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { useKeymakerStore } from '@/lib/store';

export interface TokenCreationParams {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  description?: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface TokenCreationResult {
  mintAddress: string;
  associatedTokenAccount: string;
  txSignature: string;
  decimals: number;
  supply: number;
}

export interface LiquidityPoolParams {
  tokenMint: PublicKey;
  solAmount: number;
  tokenAmount: number;
  platform: 'pump.fun' | 'raydium' | 'letsbonk.fun' | 'moonshot';
}

export interface LiquidityPoolResult {
  poolAddress: string;
  lpTokenMint?: string;
  txSignature: string;
}

/**
 * Launch a token on the specified platform
 */
export async function launchToken(
  connection: Connection,
  payer: Keypair,
  tokenParams: TokenCreationParams,
  liquidityParams: {
    platform: 'pump.fun' | 'raydium' | 'letsbonk.fun' | 'moonshot';
    solAmount: number;
    tokenAmount: number;
  }
): Promise<{
  token: {
    mintAddress: string;
    txSignature: string;
    decimals: number;
    supply: number;
  };
  liquidity: LiquidityPoolResult;
}> {
  try {
    // Validate parameters
    const validation = validateTokenParams(tokenParams);
    if (!validation.valid) {
      throw new Error(`Invalid token parameters: ${validation.errors.join(', ')}`);
    }

    logger.info(`Launching token on ${liquidityParams.platform}...`, { 
      name: tokenParams.name,
      symbol: tokenParams.symbol,
      platform: liquidityParams.platform 
    });

    // Add notification
    const { addNotification } = useKeymakerStore.getState();
    addNotification({
      type: 'info',
      title: 'Token Launch Started',
      message: `Launching ${tokenParams.symbol} on ${liquidityParams.platform}`
    });

    const metadata = {
      name: tokenParams.name,
      symbol: tokenParams.symbol,
      description: tokenParams.description || `${tokenParams.name} - Created with The Keymaker`,
      image: tokenParams.imageUrl,
      telegram: tokenParams.telegram,
      website: tokenParams.website,
      twitter: tokenParams.twitter
    };

    let tokenAddress: string;
    let txSignature: string;
    let decimals: number;
    let supply: number;

    // Launch token based on platform
    switch (liquidityParams.platform) {
      case 'letsbonk.fun': {
        const letsbonkService = await import('./letsbonkService');
        tokenAddress = await letsbonkService.createToken(
          tokenParams.name,
          tokenParams.symbol,
          tokenParams.supply,
          metadata,
          payer
        );
        txSignature = tokenAddress; // LetsBonk returns address as signature
        decimals = tokenParams.decimals || 6;
        supply = tokenParams.supply;
        break;
      }

      case 'pump.fun': {
        const pumpfunService = await import('./pumpfunService');
        tokenAddress = await pumpfunService.createToken(
          tokenParams.name,
          tokenParams.symbol,
          tokenParams.supply,
          metadata
        );
        txSignature = tokenAddress;
        decimals = 9; // Pump.fun uses 9 decimals
        supply = tokenParams.supply;
        break;
      }

      case 'moonshot': {
        const moonshotService = await import('./moonshotService');
        tokenAddress = await moonshotService.createToken(
          tokenParams.name,
          tokenParams.symbol,
          tokenParams.supply,
          metadata
        );
        txSignature = tokenAddress;
        decimals = 9;
        supply = tokenParams.supply;
        break;
      }

      case 'raydium': {
        // For Raydium, we create the token manually then add liquidity
        const result = await createToken(connection, payer, tokenParams);
        tokenAddress = result.mintAddress;
        txSignature = result.txSignature;
        decimals = result.decimals;
        supply = result.supply;
        
        // Wait for confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add liquidity on Raydium
        const raydiumService = await import('./raydiumService');
        const poolTx = await raydiumService.createLiquidityPool(
          tokenAddress,
          liquidityParams.solAmount,
          liquidityParams.tokenAmount
        );
        
        logger.info(`Raydium liquidity pool created`, { poolTx });
        break;
      }

      default:
        throw new Error(`Unsupported platform: ${liquidityParams.platform}`);
    }

    logger.info(`Token launched successfully: ${tokenAddress}`, {
      mintAddress: tokenAddress,
      platform: liquidityParams.platform,
      txSignature
    });

    // Add success notification
    addNotification({
      type: 'success',
      title: 'Token Launched Successfully',
      message: `${tokenParams.symbol} deployed at ${tokenAddress.slice(0, 8)}...`
    });

    return {
      token: {
        mintAddress: tokenAddress,
        txSignature,
        decimals,
        supply
      },
      liquidity: {
        poolAddress: tokenAddress, // Most platforms return token address as pool address
        txSignature
      }
    };
  } catch (error) {
    Sentry.captureException(error);
    logger.error('Token launch failed', { error });
    
    // Add error notification
    const { addNotification } = useKeymakerStore.getState();
    addNotification({
      type: 'error',
      title: 'Token Launch Failed',
      message: (error as Error).message
    });
    
    throw new Error(`Token launch failed: ${(error as Error).message}`);
  }
}

/**
 * Create SPL token (for Raydium manual creation)
 */
export async function createToken(
  connection: Connection,
  payer: Keypair,
  params: TokenCreationParams
): Promise<TokenCreationResult> {
  try {
    // Validate parameters first
    const validation = validateTokenParams(params);
    if (!validation.valid) {
      throw new Error(`Invalid token parameters: ${validation.errors.join(', ')}`);
    }
    
    // Generate new mint keypair
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    
    // Calculate rent exemption
    const mintRent = await connection.getMinimumBalanceForRentExemption(82);
    
    // Get associated token account
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint,
      payer.publicKey
    );
    
    // Create transaction
    const transaction = new Transaction();
    
    // 1. Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: 82,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // 2. Initialize mint
    transaction.add(
      createInitializeMintInstruction(
        mint,
        params.decimals,
        payer.publicKey, // mint authority
        payer.publicKey  // freeze authority (can be null)
      )
    );
    
    // 3. Create associated token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedTokenAccount,
        payer.publicKey,
        mint
      )
    );
    
    // 4. Mint tokens
    const mintAmount = params.supply * Math.pow(10, params.decimals);
    transaction.add(
      createMintToInstruction(
        mint,
        associatedTokenAccount,
        payer.publicKey,
        mintAmount
      )
    );
    
    // Sign and send transaction
    transaction.feePayer = payer.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    // Sign with both payer and mint keypair
    transaction.sign(payer, mintKeypair);
    
    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, mintKeypair],
      {
        commitment: 'confirmed',
      }
    );
    
    return {
      mintAddress: mint.toBase58(),
      associatedTokenAccount: associatedTokenAccount.toBase58(),
      txSignature,
      decimals: params.decimals,
      supply: params.supply,
    };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(`Token creation failed: ${(error as Error).message}`);
  }
}

export default {
  createToken,
  launchToken,
}; 