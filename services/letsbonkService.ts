import axios from 'axios';
import { Keypair } from '@solana/web3.js';
import { logTokenLaunch } from './executionLogService';
import * as Sentry from '@sentry/nextjs';

type TokenMetadata = {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  telegram?: string;
  website?: string;
  twitter?: string;
};

/**
 * Create a token on letsbonk.fun platform
 * This integrates with the Python MCP backend for actual token creation
 */
export async function createToken(
  name: string, 
  symbol: string, 
  supply: number, 
  metadata: TokenMetadata,
  payer: Keypair
): Promise<string> {
  try {
    // Call Python backend via API proxy
    const response = await axios.post('/api/proxy', {
      method: 'launch-token',
      params: {
        name: name.slice(0, 32),
        symbol: symbol.slice(0, 10),
        description: metadata.description || `${name} - Created with The Keymaker`,
        twitter: metadata.twitter || '',
        telegram: metadata.telegram || '',
        website: metadata.website || '',
        imageUrl: metadata.image || '',
        keypair: payer.secretKey.toString(), // Will be handled securely in proxy
      }
    }, {
      timeout: 60000 // 60 seconds for token creation
    });

    const result = response.data;
    
    if (!result.success || !result.mintAddress) {
      throw new Error(result.error || 'Token creation failed');
    }

    // Log token launch
    await logTokenLaunch({
      tokenAddress: result.mintAddress,
      name,
      symbol,
      platform: 'letsbonk.fun',
      supply: supply.toString(),
      decimals: result.decimals || 6,
      launcherWallet: payer.publicKey.toBase58(),
      transactionSignature: result.txSignature || '',
      liquidityPoolAddress: result.poolAddress
    });

    return result.mintAddress;
  } catch (error: any) {
    Sentry.captureException(error);
    console.error('LetsBonk token creation error:', error.response?.data || error.message);
    throw new Error(`Failed to create token on LetsBonk: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Buy tokens on letsbonk.fun
 */
export async function buyToken(
  tokenMint: string,
  amountSol: number,
  buyer: Keypair,
  slippage = 10
): Promise<string> {
  try {
    // Call Python backend via API proxy
    const response = await axios.post('/api/proxy', {
      method: 'buy-token',
      params: {
        tokenMint,
        amountSol,
        slippage,
        keypair: buyer.secretKey.toString(),
      }
    }, {
      timeout: 30000
    });

    const result = response.data;
    
    if (!result.success || !result.txSignature) {
      throw new Error(result.error || 'Token purchase failed');
    }

    return result.txSignature;
  } catch (error: any) {
    Sentry.captureException(error);
    console.error('LetsBonk buy error:', error.response?.data || error.message);
    throw new Error(`Failed to buy token on LetsBonk: ${error.response?.data?.error || error.message}`);
  }
}

export async function createLiquidityPool(
  token: string
): Promise<string> {
  // LetsBonk handles liquidity automatically during token creation
  // This is a no-op for compatibility
  return token;
}

export default {
  createToken,
  buyToken,
  createLiquidityPool
}; 