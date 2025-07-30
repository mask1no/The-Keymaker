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
  platform: 'pump.fun' | 'raydium';
}

export interface LiquidityPoolResult {
  poolAddress: string;
  lpTokenMint?: string;
  txSignature: string;
}

/**
 * Create SPL token (without metadata for now)
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

/**
 * Create liquidity pool on pump.fun
 */
export async function createPumpFunLiquidity(
  connection: Connection,
  payer: Keypair,
  params: LiquidityPoolParams
): Promise<LiquidityPoolResult> {
  try {
    // Import pump.fun service
    const pumpfunService = await import('./pumpfunService');
    
    // For now, return a placeholder - the actual implementation depends on pump.fun's API
    const result = await pumpfunService.createToken(
      'Token', // You should fetch this from metadata
      'TKN',  // You should fetch this from metadata
      params.tokenAmount,
      {
        name: 'Token',
        symbol: 'TKN',
        description: '',
        image: '',
        telegram: '',
        website: '',
        twitter: ''
      }
    );
    
    return {
      poolAddress: params.tokenMint.toBase58(), // Placeholder
      txSignature: result,
    };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(`Pump.fun liquidity creation failed: ${(error as Error).message}`);
  }
}

/**
 * Create liquidity pool on Raydium
 */
export async function createRaydiumLiquidity(
  connection: Connection,
  payer: Keypair,
  params: LiquidityPoolParams
): Promise<LiquidityPoolResult> {
  try {
    // Import raydium service
    const raydiumService = await import('./raydiumService');
    
    // For now, use the existing raydium service method
    const result = await raydiumService.createToken(
      'Token',
      'TKN',
      params.tokenAmount,
      {
        name: 'Token',
        symbol: 'TKN',
        description: '',
        image: '',
        telegram: '',
        website: '',
        twitter: ''
      },
      payer
    );
    
    return {
      poolAddress: params.tokenMint.toBase58(), // Placeholder
      txSignature: result,
    };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(`Raydium liquidity creation failed: ${(error as Error).message}`);
  }
}

/**
 * Full token launch with liquidity
 */
export async function launchToken(
  connection: Connection,
  payer: Keypair,
  tokenParams: TokenCreationParams,
  liquidityParams: {
    platform: 'pump.fun' | 'raydium';
    solAmount: number;
    tokenAmount: number;
  }
): Promise<{
  token: TokenCreationResult;
  liquidity: LiquidityPoolResult;
}> {
  try {
    // Step 1: Create token
    logger.info('Creating token...', { params: tokenParams });
    const tokenResult = await createToken(connection, payer, tokenParams);
    logger.info(`Token created: ${tokenResult.mintAddress}`, { mintAddress: tokenResult.mintAddress });
    
    // Wait a bit for token to be fully confirmed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Create liquidity pool
    logger.info(`Creating liquidity pool on ${liquidityParams.platform}...`, { 
      platform: liquidityParams.platform,
      solAmount: liquidityParams.solAmount,
      tokenAmount: liquidityParams.tokenAmount 
    });
    const mintPubkey = new PublicKey(tokenResult.mintAddress);
    
    let liquidityResult: LiquidityPoolResult;
    
    if (liquidityParams.platform === 'pump.fun') {
      liquidityResult = await createPumpFunLiquidity(connection, payer, {
        tokenMint: mintPubkey,
        solAmount: liquidityParams.solAmount,
        tokenAmount: liquidityParams.tokenAmount,
        platform: 'pump.fun',
      });
    } else {
      liquidityResult = await createRaydiumLiquidity(connection, payer, {
        tokenMint: mintPubkey,
        solAmount: liquidityParams.solAmount,
        tokenAmount: liquidityParams.tokenAmount,
        platform: 'raydium',
      });
    }
    
    logger.info(`Liquidity pool created: ${liquidityResult.poolAddress}`, {
      poolAddress: liquidityResult.poolAddress,
      platform: liquidityParams.platform
    });
    
    return {
      token: tokenResult,
      liquidity: liquidityResult,
    };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(`Token launch failed: ${(error as Error).message}`);
  }
}

export default {
  createToken,
  createPumpFunLiquidity,
  createRaydiumLiquidity,
  launchToken,
}; 