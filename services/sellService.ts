import { Connection, VersionedTransaction } from '@solana/web3.js';
import { getTokenPrice, buildSwapTransaction, WSOL_MINT, convertToLamports } from './jupiterService';
import { logSellEvent, logPnL } from './executionLogService';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_BIRDEYE_API_KEY } from '../constants';
import axios from 'axios';

interface SellConditions {
  marketCapThreshold?: number;  // Sell when market cap reaches this value
  profitPercentage?: number;    // Sell when profit reaches this percentage
  lossPercentage?: number;      // Sell when loss reaches this percentage (stop loss)
  timeDelay?: number;           // Sell after this many seconds
  priceTarget?: number;         // Sell when price reaches this target
}

interface TokenHolding {
  wallet: string;
  tokenAddress: string;
  amount: number;
  entryPrice: number;
  entryTime: number;
  entrySOL: number;
}

interface MarketData {
  price: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
}

export async function getMarketData(
  tokenAddress: string
): Promise<MarketData> {
  try {
    // Try Birdeye first
    if (NEXT_PUBLIC_BIRDEYE_API_KEY) {
      const response = await axios.get(
        `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`,
        {
          headers: {
            'X-API-KEY': NEXT_PUBLIC_BIRDEYE_API_KEY,
            'Accept': 'application/json'
          },
          timeout: 5000
        }
      );
      
      const data = response.data?.data;
      if (data) {
        return {
          price: data.price || 0,
          marketCap: data.mc || 0,
          liquidity: data.liquidity || 0,
          volume24h: data.v24hUSD || 0,
          priceChange24h: data.v24hChangePercent || 0
        };
      }
    }
    
    // Fallback to Jupiter price
    const price = await getTokenPrice(tokenAddress, 'USDC');
    return {
      price,
      marketCap: 0, // Would need supply to calculate
      liquidity: 0,
      volume24h: 0,
      priceChange24h: 0
    };
  } catch (error) {
    console.error('Failed to get market data:', error);
    throw error;
  }
}

export function checkSellConditions(
  holding: TokenHolding,
  marketData: MarketData,
  conditions: SellConditions
): { shouldSell: boolean; reason: string } {
  const currentTime = Date.now();
  const holdTime = (currentTime - holding.entryTime) / 1000; // in seconds
  
  // Calculate current value and P/L
  const currentValue = holding.amount * marketData.price;
  const profitLoss = currentValue - holding.entrySOL;
  const profitPercentage = (profitLoss / holding.entrySOL) * 100;
  
  // Check market cap threshold
  if (conditions.marketCapThreshold && marketData.marketCap >= conditions.marketCapThreshold) {
    return { 
      shouldSell: true, 
      reason: `Market cap reached ${conditions.marketCapThreshold.toLocaleString()}` 
    };
  }
  
  // Check profit target
  if (conditions.profitPercentage && profitPercentage >= conditions.profitPercentage) {
    return { 
      shouldSell: true, 
      reason: `Profit target reached: ${profitPercentage.toFixed(2)}%` 
    };
  }
  
  // Check stop loss
  if (conditions.lossPercentage && profitPercentage <= -conditions.lossPercentage) {
    return { 
      shouldSell: true, 
      reason: `Stop loss triggered: ${profitPercentage.toFixed(2)}%` 
    };
  }
  
  // Check time delay
  if (conditions.timeDelay && holdTime >= conditions.timeDelay) {
    return { 
      shouldSell: true, 
      reason: `Time delay reached: ${holdTime.toFixed(0)}s` 
    };
  }
  
  // Check price target
  if (conditions.priceTarget && marketData.price >= conditions.priceTarget) {
    return { 
      shouldSell: true, 
      reason: `Price target reached: $${marketData.price.toFixed(6)}` 
    };
  }
  
  return { shouldSell: false, reason: '' };
}

export async function executeSell(
  holding: TokenHolding,
  slippageBps = 100, // 1% default
  priorityFee = 10000, // 0.00001 SOL default
  connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
): Promise<{ 
  transaction: VersionedTransaction; 
  expectedSOL: number;
  signature?: string;
}> {
  try {
    // Get token decimals (assuming 9 for now, should fetch from chain)
    const decimals = 9;
    const amountLamports = convertToLamports(holding.amount, decimals);
    
    // Build sell transaction
    const swapTx = await buildSwapTransaction(
      holding.tokenAddress,
      WSOL_MINT,
      amountLamports,
      holding.wallet,
      slippageBps,
      priorityFee
    );
    
    // Get expected output
    const marketData = await getMarketData(holding.tokenAddress);
    const expectedSOL = holding.amount * marketData.price;
    
    return {
      transaction: swapTx,
      expectedSOL
    };
  } catch (error) {
    console.error('Failed to build sell transaction:', error);
    throw error;
  }
}

export async function logSellTransaction(
  holding: TokenHolding,
  marketData: MarketData,
  solEarned: number,
  transactionSignature: string
): Promise<void> {
  try {
    // Log sell event
    await logSellEvent({
      wallet: holding.wallet,
      tokenAddress: holding.tokenAddress,
      amountSold: holding.amount.toString(),
      solEarned,
      marketCap: marketData.marketCap,
      profitPercentage: ((solEarned - holding.entrySOL) / holding.entrySOL) * 100,
      transactionSignature
    });
    
    // Log P/L
    await logPnL({
      wallet: holding.wallet,
      tokenAddress: holding.tokenAddress,
      entryPrice: holding.entryPrice,
      exitPrice: marketData.price,
      solInvested: holding.entrySOL,
      solReturned: solEarned,
      profitLoss: solEarned - holding.entrySOL,
      profitPercentage: ((solEarned - holding.entrySOL) / holding.entrySOL) * 100,
      holdTime: Math.floor((Date.now() - holding.entryTime) / 1000)
    });
  } catch (error) {
    console.error('Failed to log sell transaction:', error);
  }
}

export async function monitorAndSell(
  holdings: TokenHolding[],
  conditions: SellConditions,
  checkInterval = 30000 // Check every 30 seconds
): Promise<void> {
  console.log(`Monitoring ${holdings.length} positions for sell conditions...`);
  
  const interval = setInterval(async () => {
    for (const holding of holdings) {
      try {
        const marketData = await getMarketData(holding.tokenAddress);
        const { shouldSell, reason } = checkSellConditions(holding, marketData, conditions);
        
        if (shouldSell) {
          console.log(`Sell signal for ${holding.tokenAddress}: ${reason}`);
          // In production, you would execute the sell here
          // For now, just log it
          clearInterval(interval);
        }
      } catch (error) {
        console.error(`Error checking ${holding.tokenAddress}:`, error);
      }
    }
  }, checkInterval);
  
  // Return cleanup function
  return () => clearInterval(interval);
}

export function calculateOptimalSellTime(
  priceHistory: { time: number; price: number }[],
  volumeHistory: { time: number; volume: number }[]
): number {
  // Simple momentum-based sell signal
  if (priceHistory.length < 3) return 0;
  
  const recentPrices = priceHistory.slice(-3);
  const priceChange1 = (recentPrices[1].price - recentPrices[0].price) / recentPrices[0].price;
  const priceChange2 = (recentPrices[2].price - recentPrices[1].price) / recentPrices[1].price;
  
  // Declining momentum
  if (priceChange2 < priceChange1 * 0.5) {
    return Date.now(); // Sell now
  }
  
  // Volume analysis
  if (volumeHistory.length >= 2) {
    const recentVolume = volumeHistory[volumeHistory.length - 1].volume;
    const avgVolume = volumeHistory.reduce((sum, v) => sum + v.volume, 0) / volumeHistory.length;
    
    // Declining volume
    if (recentVolume < avgVolume * 0.5) {
      return Date.now(); // Sell now
    }
  }
  
  return 0; // Don't sell yet
} 