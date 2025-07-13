import { Connection, Transaction, Signer } from '@solana/web3.js';
import axios from 'axios';
import { validateToken } from './bundleService';
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';
import { SystemProgram, PublicKey } from '@solana/web3.js';

async function snipeToken(platform: string, tokenAddress: string, amount: number, maxSlippage: number, connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed'), signer: Signer): Promise<string> {
  if (!(await validateToken(tokenAddress))) {
    throw new Error('Invalid token');
  }
  let attempts = 0;
  while (attempts < 3) {
    try {
      // Placeholder with slippage: Adjust amount based on maxSlippage (e.g., amount *= (1 - maxSlippage / 100))
      const adjustedAmount = amount * (1 - maxSlippage / 100);
      const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: new PublicKey(tokenAddress), lamports: adjustedAmount * 1e9 }));
      return await connection.sendTransaction(tx, [signer], { maxRetries: 3 });
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      if (attempts === 3) throw error;
    }
  }
}

// Helius Webhook setup (call once to register)
export async function setupWebhook(programId = '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg') {
  const response = await axios.post('https://api.helius.xyz/v0/webhooks', {
    webhookURL: 'your_webhook_endpoint', // e.g., your server to receive events
    transactionTypes: ['Any'],
    accountAddresses: [programId],
  }, { params: { api_key: process.env.HELIUS_API_KEY } });
  console.log('Webhook ID:', response.data.webhookID);
}

export { snipeToken, setupWebhook }; 