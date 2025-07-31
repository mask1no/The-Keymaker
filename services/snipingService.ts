import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { validateToken } from './bundleService';
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';
import { getQuote, getSwapTransaction } from './jupiterService';
import { logger } from '@/lib/logger';

export async function snipeToken(
  tokenAddress: string, 
  solAmount: number, // in SOL
  maxSlippage: number, // in percentage (e.g., 1 for 1%)
  connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed'), 
  signer: Keypair
): Promise<string> {
  if (!(await validateToken(tokenAddress))) {
    throw new Error('Invalid token');
  }
  
  let attempts = 0;
  while (attempts < 3) {
    try {
      // Convert SOL amount to lamports
      const inputAmount = Math.floor(solAmount * 1e9);
      
      // Get quote from Jupiter
      const quote = await getQuote(
        'So11111111111111111111111111111111111111112', // SOL mint
        tokenAddress,
        inputAmount,
        maxSlippage * 100 // Convert to basis points
      );
      
      if (!quote) {
        throw new Error('Failed to get swap quote');
      }
      
      // Log the expected output
      logger.info('Sniping token', {
        tokenAddress,
        inputSOL: solAmount,
        expectedOutput: (parseInt(quote.outAmount) / 1e9).toFixed(2),
        priceImpact: quote.priceImpactPct
      });
      
      // Get swap transaction from Jupiter
      const { swapTransaction } = await getSwapTransaction(
        quote,
        signer.publicKey.toBase58()
      );
      
      // Deserialize and sign the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Sign with the signer's keypair
      transaction.sign([signer]);
      
      // Send transaction
      const latestBlockhash = await connection.getLatestBlockhash();
      const txid = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      });
      
      // Confirm transaction
      await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');
      
      logger.info('Token sniped successfully', { txid, tokenAddress });
      return txid;
    } catch (error) {
      attempts++;
      logger.error(`Snipe attempt ${attempts} failed`, { error, tokenAddress });
      
      if (attempts < 3) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retry attempts exceeded');
}

// Helius Webhook setup (call once to register)
export async function setupWebhook(programId = '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg', webhookURL: string): Promise<string> {
  if (!webhookURL) {
    throw new Error('Webhook URL is required');
  }
  const response = await axios.post('https://api.helius.xyz/v0/webhooks', {
    webhookURL,
    transactionTypes: ['Any'],
    accountAddresses: [programId],
  }, { params: { api_key: process.env.HELIUS_API_KEY } });
  return response.data.webhookID;
} 