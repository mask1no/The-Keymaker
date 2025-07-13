import axios from 'axios';
import { createToken as raydiumCreate } from './raydiumService';

type TokenMetadata = { name: string; ticker: string; supply: number };

async function createToken(name: string, ticker: string, supply: number, metadata: TokenMetadata): Promise<string> {
  try {
    const response = await axios.post('https://api.letsbonk.fun/create', { name, ticker, supply, metadata }, {
      method: 'POST', // Explicit
      headers: { 'Authorization': `Bearer ${process.env.LETSBONK_API_KEY}` },
      timeout: 5000
    });
    return response.data.tokenAddress;
  } catch (error) {
    console.error('LetsBonk API failed, falling back to Raydium');
    return raydiumCreate(name, ticker, supply, metadata);
  }
}

export { createToken };

export async function createLiquidityPool(token: string, solAmount: number): Promise<string> {
  try {
    const response = await axios.post('letsbonk.api/lp', { token, solAmount }, { headers: { 'Authorization': process.env.LETSBONK_API_KEY } });
    return response.data.poolId;
  } catch {
    return raydiumCreatePool(token, solAmount);
  }
} 