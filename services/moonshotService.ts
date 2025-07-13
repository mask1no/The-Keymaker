import axios from 'axios';
import { createToken as raydiumCreate } from './raydiumService';

type TokenMetadata = { name: string; ticker: string; supply: number };

async function createToken(name: string, ticker: string, supply: number, metadata: TokenMetadata): Promise<string> {
  try {
    const response = await axios.post('https://api.moonshot.cc/create', { name, ticker, supply, metadata }, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}` },
      timeout: 5000
    });
    return response.data.tokenAddress;
  } catch (error) {
    console.error('Moonshot API failed, falling back to Raydium');
    return raydiumCreate(name, ticker, supply, metadata);
  }
}

export { createToken }; 