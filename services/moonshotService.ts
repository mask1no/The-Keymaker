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
    // Moonshot API endpoint - this is a placeholder
    // In production, use the actual Moonshot API
    const response = await axios.post(
      'https://api.moonshot.fun/token/create',
      {
        name: name.slice(0, 32),
        symbol: symbol.slice(0, 10),
        totalSupply: supply,
        description: metadata.description || `${name} - Created with The Keymaker`,
        imageUrl: metadata.image,
        telegram: metadata.telegram,
        website: metadata.website,
        twitter: metadata.twitter
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MOONSHOT_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const tokenAddress = response.data.tokenAddress || response.data.mint;
    
    if (!tokenAddress) {
      throw new Error('No token address returned from Moonshot');
    }
    
    // Log token launch
    await logTokenLaunch({
      tokenAddress,
      name,
      symbol,
      platform: 'Moonshot',
      supply: supply.toString(),
      decimals: 9,
      launcherWallet: '', // Would need to be passed in
      transactionSignature: response.data.transactionHash || '',
      liquidityPoolAddress: response.data.poolAddress
    });
    
    return tokenAddress;
  } catch (error: any) {
    console.error('Moonshot token creation error:', error.response?.data || error.message);
    throw new Error(`Failed to create token on Moonshot: ${error.response?.data?.message || error.message}`);
  }
}

export async function createLiquidityPool(
  token: string, 
  solAmount: number
): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.moonshot.fun/liquidity/add',
      {
        tokenAddress: token,
        solAmount: solAmount,
        autoLock: true // Moonshot often auto-locks liquidity
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MOONSHOT_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return response.data.poolAddress || `moonshot_pool_${token.slice(0, 8)}`;
  } catch (error: any) {
    console.error('Moonshot pool creation error:', error.response?.data || error.message);
    throw new Error(`Failed to create liquidity pool: ${error.response?.data?.message || error.message}`);
  }
}

export async function getTokenInfo(tokenAddress: string): Promise<{
  name: string;
  symbol: string;
  marketCap: number;
  liquidity: number;
  priceUsd: number;
  holders: number;
}> {
  try {
    const response = await axios.get(
      `https://api.moonshot.fun/token/${tokenAddress}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MOONSHOT_API_KEY || ''}`,
        },
        timeout: 10000
      }
    );
    
    const data = response.data;
    
    return {
      name: data.name || 'Unknown',
      symbol: data.symbol || 'UNKNOWN',
      marketCap: data.marketCap || 0,
      liquidity: data.liquidity || 0,
      priceUsd: data.price || 0,
      holders: data.holderCount || 0
    };
  } catch (error: any) {
    console.error('Failed to get token info from Moonshot:', error);
    throw new Error(`Failed to get token info: ${error.message}`);
  }
} 