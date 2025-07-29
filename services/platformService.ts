import axios from 'axios';
import { Keypair } from '@solana/web3.js';
import * as pumpfunService from './pumpfunService';
import * as letsbonkService from './letsbonkService';
import * as raydiumService from './raydiumService';
import * as moonshotService from './moonshotService';

type TokenMetadata = { name: string; ticker: string; supply: number; image: string; telegram: string; website: string; x: string };

export interface CreateTokenParams {
  creator: Keypair;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  platform: 'pump.fun' | 'letsbonk.fun' | 'raydium' | 'moonshot';
  lpAmount: number;
  description?: string;
  image?: string;
  socials?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

export interface CreateTokenResult {
  success: boolean;
  mintAddress?: string;
  txSignature?: string;
  poolAddress?: string;
  error?: string;
}

export async function createToken(params: CreateTokenParams): Promise<CreateTokenResult> {
  try {
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description || `${params.name} - Created with The Keymaker`,
      image: params.image || '',
      twitter: params.socials?.twitter || '',
      telegram: params.socials?.telegram || '',
      website: params.socials?.website || ''
    };

    let result: string | any;
    
    switch (params.platform) {
      case 'pump.fun':
        // pumpfunService.createToken returns a string (transaction signature)
        result = await pumpfunService.createToken(
          params.name,
          params.symbol,
          params.supply,
          metadata
        );
        return {
          success: true,
          txSignature: result,
          mintAddress: result // For now, using tx signature as mint address placeholder
        };
      
      case 'letsbonk.fun':
        // letsbonkService.createToken returns a string
        result = await letsbonkService.createToken(
          params.name,
          params.symbol,
          params.supply,
          metadata
        );
        return {
          success: true,
          txSignature: result,
          mintAddress: result
        };
      
      case 'raydium':
        // raydiumService.createToken has different signature
        result = await raydiumService.createToken(
          params.name,
          params.symbol,
          params.supply,
          metadata,
          params.creator
        );
        return {
          success: true,
          txSignature: result,
          mintAddress: result // raydiumService returns string, not object
        };
        
      case 'moonshot':
        // moonshotService.createToken returns a string
        result = await moonshotService.createToken(
          params.name,
          params.symbol,
          params.supply,
          metadata
        );
        return {
          success: true,
          txSignature: result,
          mintAddress: result
        };
      
      default:
        throw new Error(`Unsupported platform: ${params.platform}`);
    }
  } catch (error) {
    console.error('Token creation failed:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

async function cloneToken(platform: string, tokenAddress: string): Promise<TokenMetadata> {
  try {
    const response = await axios.get(`https://public-api.birdeye.so/token/${tokenAddress}`, {
      headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY },
      timeout: 5000
    });
    const metadata = response.data;
    // Placeholder: Deploy new token with metadata on platform
    return metadata;
  } catch (error) {
    // Failed to clone token
    throw new Error('Token cloning failed');
  }
}

export { cloneToken }; 