import axios from 'axios';
import { PUMPFUN_API_KEY } from '../constants';

export async function createToken(name: string, ticker: string, supply: number, metadata: { image: string, telegram: string, website: string, x: string }): Promise<string> {
  const response = await axios.post('https://pumpportal.fun/api/create', {
    name, ticker, supply, metadata
  }, { headers: { 'Authorization': PUMPFUN_API_KEY } });
  return response.data.tokenAddress;
}

export async function createLiquidityPool(token: string, solAmount: number): Promise<string> {
  const response = await axios.post('https://pumpportal.fun/api/lp', {
    token, solAmount
  }, { headers: { 'Authorization': PUMPFUN_API_KEY } });
  return response.data.poolId;
} 