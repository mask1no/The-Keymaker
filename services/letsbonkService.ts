import axios from 'axios';
import { logTokenLaunch } from './executionLogService';

type TokenMetadata = { 
  name: string; 
  symbol: string; 
  description?: string;
  image?: string;
  telegram?: string;
  website?: string;
  twitter?: string;
};

export async function createToken(
  name: string, 
  symbol: string, 
  supply: number, 
  metadata: TokenMetadata
): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.letsbonk.fun/create', 
      { 
        name,
        symbol,
        supply,
        description: metadata.description,
        image: metadata.image,
        telegram: metadata.telegram,
        website: metadata.website,
        twitter: metadata.twitter
      }, 
      {
        headers: { 
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LETSBONK_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const tokenAddress = response.data.tokenAddress;
    
    // Log token launch
    await logTokenLaunch({
      tokenAddress,
      name,
      symbol,
      platform: 'LetsBonk.fun',
      supply: supply.toString(),
      decimals: 9,
      launcherWallet: '', // Would need to be passed in
      transactionSignature: response.data.signature || ''
    });
    
    return tokenAddress;
  } catch (error: any) {
    console.error('LetsBonk API failed:', error.message);
    
    // Check if API key is missing
    if (!process.env.NEXT_PUBLIC_LETSBONK_API_KEY) {
      throw new Error('LetsBonk API key not configured. Please add your API key in settings.');
    }
    
    throw new Error(`LetsBonk token creation failed: ${error.message}`);
  }
}

export async function createLiquidityPool(
  token: string, 
  solAmount: number
): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.letsbonk.fun/pool/create',
      { 
        tokenAddress: token, 
        solAmount 
      },
      { 
        headers: { 
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LETSBONK_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return response.data.poolId || `letsbonk_pool_${token.slice(0, 8)}`;
  } catch (error: any) {
    console.error('LetsBonk pool creation failed:', error.message);
    throw new Error(`Failed to create liquidity pool: ${error.message}`);
  }
} 