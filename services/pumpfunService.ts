import axios from 'axios';

type TokenMetadata = { name: string; ticker: string; supply: number };

async function createToken(name: string, ticker: string, supply: number, metadata: TokenMetadata): Promise<string> {
  const response = await axios.post('https://api.pumpportal.fun/create', { name, ticker, supply, metadata }, {
    headers: { 'Authorization': `Bearer ${process.env.PUMPFUN_API_KEY}` },
    timeout: 5000
  });
  return response.data.tokenAddress;
}

export { createToken };

export async function createLiquidityPool(token: string, solAmount: number): Promise<string> {
  const response = await axios.post('https://pumpportal.fun/api/lp', {
    token, solAmount
  }, { headers: { 'Authorization': `Bearer ${process.env.PUMPFUN_API_KEY}` }, timeout: 5000 });
  return response.data.poolId;
} 