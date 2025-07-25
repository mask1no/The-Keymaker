import { Connection, PublicKey, Transaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import { createJupiterApiClient } from '@jup-ag/api';
import { logSellEvent, logPnL } from './executionLogService';

interface SellTrigger {
  type: 'marketCap' | 'profitPercentage' | 'time' | 'price';
  value: number;
  comparison: 'gt' | 'lt' | 'eq'; // greater than, less than, equal
}

interface TokenPosition {
  wallet: string;
  tokenAddress: string;
  amount: string;
  entryPrice: number;
  entryTime: Date;
  solInvested: number;
}

interface MarketData {
  price: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
}

interface SellOrder {
  wallet: Keypair;
  tokenAddress: string;
  amount: string;
  percentage: number; // 0-100, percentage of holdings to sell
  minSolOutput: number;
  slippage: number;
}

/**
 * Get current market data for a token
 */
async function getTokenMarketData(tokenAddress: string): Promise<MarketData> {
  try {
    const response = await axios.get(
      `https://public-api.birdeye.so/token/${tokenAddress}`,
      {
        headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY },
        timeout: 5000
      }
    );
    
    return {
      price: response.data.price || 0,
      marketCap: response.data.mc || 0,
      liquidity: response.data.liquidity || 0,
      volume24h: response.data.v24hUSD || 0
    };
  } catch (error) {
          // Failed to fetch market data
    return { price: 0, marketCap: 0, liquidity: 0, volume24h: 0 };
  }
}

/**
 * Check if a sell trigger has been met
 */
export async function checkSellTrigger(
  position: TokenPosition,
  trigger: SellTrigger,
  currentData?: MarketData
): Promise<boolean> {
  if (!currentData) {
    currentData = await getTokenMarketData(position.tokenAddress);
  }
  
  let value: number;
  
  switch (trigger.type) {
    case 'marketCap':
      value = currentData.marketCap;
      break;
      
    case 'profitPercentage': {
      const currentValue = parseFloat(position.amount) * currentData.price;
      const profitPercentage = ((currentValue - position.solInvested) / position.solInvested) * 100;
      value = profitPercentage;
      break;
    }
      
    case 'time': {
      const holdTime = (Date.now() - position.entryTime.getTime()) / 1000; // seconds
      value = holdTime;
      break;
    }
      
    case 'price':
      value = currentData.price;
      break;
      
    default:
      return false;
  }
  
  switch (trigger.comparison) {
    case 'gt': return value > trigger.value;
    case 'lt': return value < trigger.value;
    case 'eq': return Math.abs(value - trigger.value) < 0.001;
    default: return false;
  }
}

/**
 * Execute a token sell using Jupiter
 */
export async function executeSell(
  order: SellOrder,
  connection: Connection
): Promise<string> {
  const jupiterApi = createJupiterApiClient();
  
  // Calculate amount to sell
  const sellAmount = Math.floor(
    parseFloat(order.amount) * (order.percentage / 100)
  );
  
  // Get quote from Jupiter
  const quoteResponse = await jupiterApi.quoteGet({
    inputMint: order.tokenAddress,
    outputMint: 'So11111111111111111111111111111111111111112', // SOL
    amount: sellAmount,
    slippageBps: Math.floor(order.slippage * 100),
    onlyDirectRoutes: false,
    asLegacyTransaction: false
  });
  
  const quotes = quoteResponse as any;
  if (!quotes || !quotes.data || !quotes.data.length) {
    throw new Error('No routes found for swap');
  }
  
  const bestRoute = quotes.data[0];
  const outputAmount = parseInt(bestRoute.outAmount) / LAMPORTS_PER_SOL;
  
  // Check minimum output
  if (outputAmount < order.minSolOutput) {
    throw new Error(`Output ${outputAmount} SOL is below minimum ${order.minSolOutput} SOL`);
  }
  
  // Get swap transaction
  const swapResponse = await jupiterApi.swapPost({
    swapRequest: {
      quoteResponse: bestRoute,
      userPublicKey: order.wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 10000,
          priorityLevel: "high"
        }
      }
    }
  });
  
  if (!swapResponse.swapTransaction) {
    throw new Error('Failed to create swap transaction');
  }
  
  // Deserialize and sign transaction
  const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
  const transaction = Transaction.from(swapTransactionBuf);
  
  transaction.sign(order.wallet);
  
  // Send transaction
  const signature = await connection.sendTransaction(transaction, [order.wallet], {
    skipPreflight: false,
    maxRetries: 3
  });
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  // Log sell event
  const marketData = await getTokenMarketData(order.tokenAddress);
  await logSellEvent({
    wallet: order.wallet.publicKey.toBase58(),
    tokenAddress: order.tokenAddress,
    amountSold: sellAmount.toString(),
    solEarned: outputAmount,
    marketCap: marketData.marketCap,
    profitPercentage: undefined, // Calculate if position data available
    transactionSignature: signature
  });
  
  return signature;
}

/**
 * Execute multiple sell orders as a batch
 */
export async function executeBatchSells(
  orders: SellOrder[],
  connection: Connection
): Promise<string[]> {
  const signatures: string[] = [];
  
  // Process in parallel batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(order => executeSell(order, connection))
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        signatures.push(result.value);
      } else {
        console.error(`Sell order ${i + index} failed:`, result.reason);
        signatures.push('');
      }
    });
  }
  
  return signatures;
}

/**
 * Monitor positions and execute sells based on triggers
 */
export async function monitorAndSell(
  positions: TokenPosition[],
  triggers: SellTrigger[],
  sellPercentage: number,
  slippage: number,
  minSolOutput: number,
  walletKeypairs: Map<string, Keypair>,
  connection: Connection
): Promise<string[]> {
  const sellOrders: SellOrder[] = [];
  
  // Check each position against triggers
  for (const position of positions) {
    const marketData = await getTokenMarketData(position.tokenAddress);
    
    for (const trigger of triggers) {
      if (await checkSellTrigger(position, trigger, marketData)) {
        const wallet = walletKeypairs.get(position.wallet);
        if (!wallet) {
          console.error(`No keypair found for wallet ${position.wallet}`);
          continue;
        }
        
        sellOrders.push({
          wallet,
          tokenAddress: position.tokenAddress,
          amount: position.amount,
          percentage: sellPercentage,
          minSolOutput,
          slippage
        });
        
        break; // Only sell once per position
      }
    }
  }
  
  if (sellOrders.length === 0) {
    return [];
  }
  
  // Execute sells
  const signatures = await executeBatchSells(sellOrders, connection);
  
  // Calculate and log PnL for successful sells
  for (let i = 0; i < sellOrders.length; i++) {
    if (signatures[i]) {
      const order = sellOrders[i];
      const position = positions.find(p => 
        p.wallet === order.wallet.publicKey.toBase58() && 
        p.tokenAddress === order.tokenAddress
      );
      
      if (position) {
        const marketData = await getTokenMarketData(position.tokenAddress);
        const soldAmount = parseFloat(position.amount) * (order.percentage / 100);
        const solReturned = soldAmount * marketData.price;
        const profitLoss = solReturned - (position.solInvested * (order.percentage / 100));
        const profitPercentage = (profitLoss / (position.solInvested * (order.percentage / 100))) * 100;
        
        await logPnL({
          wallet: position.wallet,
          tokenAddress: position.tokenAddress,
          entryPrice: position.entryPrice,
          exitPrice: marketData.price,
          solInvested: position.solInvested * (order.percentage / 100),
          solReturned,
          profitLoss,
          profitPercentage,
          holdTime: Math.floor((Date.now() - position.entryTime.getTime()) / 1000)
        });
      }
    }
  }
  
  return signatures;
}

/**
 * Create a simple sell all function for emergency exits
 */
export async function emergencySellAll(
  wallets: Array<{ publicKey: string; keypair: Keypair }>,
  tokenAddress: string,
  connection: Connection
): Promise<string[]> {
  const signatures: string[] = [];
  
  for (const wallet of wallets) {
    try {
      // Get token balance
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(wallet.publicKey),
        { mint: new PublicKey(tokenAddress) }
      );
      
      if (tokenAccounts.value.length === 0) continue;
      
      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
      if (balance === '0') continue;
      
      // Execute sell
      const sig = await executeSell({
        wallet: wallet.keypair,
        tokenAddress,
        amount: balance,
        percentage: 100,
        minSolOutput: 0,
        slippage: 50 // High slippage for emergency
      }, connection);
      
      signatures.push(sig);
    } catch (error) {
      console.error(`Emergency sell failed for wallet ${wallet.publicKey}:`, error);
      signatures.push('');
    }
  }
  
  return signatures;
} 