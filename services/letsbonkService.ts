import axios from 'axios';
import { LETSBONK_API_KEY } from '../constants';
import { createToken as raydiumCreateToken, createLiquidityPool as raydiumCreatePool } from './raydiumService';

export async function createToken(name: string, ticker: string, supply: number, metadata: { image: string, telegram: string, website: string, x: string }): Promise<string> {
  try {
    const response = await axios.post('letsbonk.api/create', { name, ticker, supply, metadata }, { headers: { 'Authorization': LETSBONK_API_KEY } });
    return response.data.tokenAddress;
  } catch {
    return raydiumCreateToken(name, ticker, supply, metadata);
  }
}

export async function createLiquidityPool(token: string, solAmount: number): Promise<string> {
  try {
    const response = await axios.post('letsbonk.api/lp', { token, solAmount }, { headers: { 'Authorization': LETSBONK_API_KEY } });
    return response.data.poolId;
  } catch {
    return raydiumCreatePool(token, solAmount);
  }
} 