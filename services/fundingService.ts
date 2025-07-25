import { Connection, PublicKey, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logFundingEvent } from './executionLogService';

interface WalletWithRole {
  publicKey: string;
  role: 'master' | 'dev' | 'sniper' | 'normal';
  balance?: number;
}

interface FundingDistribution {
  wallet: string;
  amount: number;
  weight: number;
}

/**
 * Calculate funding distribution based on wallet roles
 * Sniper wallets get 2x, dev wallets get 1.5x, normal wallets get 1x
 */
function calculateDistribution(
  wallets: WalletWithRole[],
  totalAmount: number,
  minAmount: number,
  maxAmount: number
): FundingDistribution[] {
  // Calculate weights based on roles
  const weights: number[] = wallets.map(w => {
    switch (w.role) {
      case 'sniper': return 2.0;
      case 'dev': return 1.5;
      case 'normal': return 1.0;
      default: return 0; // Master wallet shouldn't receive funds
    }
  });
  
  const totalWeight = weights.reduce((sum: number, w: number) => sum + w, 0);
  if (totalWeight === 0) {
    throw new Error('No eligible wallets for funding');
  }
  
  // Calculate base amounts
  const distributions: FundingDistribution[] = [];
  let remainingAmount = totalAmount;
  
  wallets.forEach((wallet, i) => {
    if (weights[i] === 0) return; // Skip master wallets
    
    // Calculate proportional amount with some randomness
    const baseAmount = (totalAmount * weights[i]) / totalWeight;
    const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120%
    let amount = baseAmount * randomFactor;
    
    // Apply min/max constraints
    amount = Math.max(minAmount, Math.min(maxAmount, amount));
    
    // Ensure we don't exceed remaining amount
    amount = Math.min(amount, remainingAmount);
    
    distributions.push({
      wallet: wallet.publicKey,
      amount,
      weight: weights[i]
    });
    
    remainingAmount -= amount;
  });
  
  // Distribute any remaining amount to random wallets
  if (remainingAmount > 0.001) {
    const eligibleDists = distributions.filter(d => d.amount < maxAmount);
    if (eligibleDists.length > 0) {
      const randomDist = eligibleDists[Math.floor(Math.random() * eligibleDists.length)];
      randomDist.amount = Math.min(randomDist.amount + remainingAmount, maxAmount);
    }
  }
  
  return distributions;
}

/**
 * Fund a group of wallets from a master wallet
 */
export async function fundWalletGroup(
  masterWallet: Keypair,
  wallets: WalletWithRole[],
  totalAmount: number,
  minAmount: number,
  maxAmount: number,
  connection: Connection
): Promise<string[]> {
  // Validate inputs
  if (totalAmount <= 0) {
    throw new Error('Total amount must be positive');
  }
  
  if (minAmount > maxAmount) {
    throw new Error('Min amount cannot exceed max amount');
  }
  
  if (wallets.length === 0) {
    throw new Error('No wallets to fund');
  }
  
  // Check master wallet balance
  const masterBalance = await connection.getBalance(masterWallet.publicKey);
  const requiredLamports = totalAmount * LAMPORTS_PER_SOL + (wallets.length * 5000); // Include fees
  
  if (masterBalance < requiredLamports) {
    throw new Error(`Insufficient balance. Required: ${requiredLamports / LAMPORTS_PER_SOL} SOL, Available: ${masterBalance / LAMPORTS_PER_SOL} SOL`);
  }
  
  // Calculate distribution
  const distributions = calculateDistribution(wallets, totalAmount, minAmount, maxAmount);
  
  // Create transactions
  const { blockhash } = await connection.getLatestBlockhash();
  const signatures: string[] = [];
  
  // Process in batches to avoid transaction size limits
  const batchSize = 5;
  for (let i = 0; i < distributions.length; i += batchSize) {
    const batch = distributions.slice(i, i + batchSize);
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = masterWallet.publicKey;
    
    // Add transfer instructions
    for (const dist of batch) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: masterWallet.publicKey,
          toPubkey: new PublicKey(dist.wallet),
          lamports: Math.floor(dist.amount * LAMPORTS_PER_SOL)
        })
      );
    }
    
    // Sign and send
    tx.sign(masterWallet);
    const sig = await connection.sendTransaction(tx, [masterWallet], {
      skipPreflight: false,
      maxRetries: 3
    });
    
    signatures.push(sig);
    
    // Wait for confirmation
    await connection.confirmTransaction(sig, 'confirmed');
  }
  
  // Log funding event
  await logFundingEvent({
    fromWallet: masterWallet.publicKey.toBase58(),
    toWallets: distributions.map(d => d.wallet),
    amounts: distributions.map(d => d.amount),
    totalAmount,
    transactionSignatures: signatures
  });
  
  return signatures;
}

/**
 * Get current balances for a group of wallets
 */
export async function getWalletBalances(
  wallets: string[],
  connection: Connection
): Promise<{ [wallet: string]: number }> {
  const balances: { [wallet: string]: number } = {};
  
  // Fetch balances in parallel
  const results = await Promise.all(
    wallets.map(async wallet => {
      try {
        const balance = await connection.getBalance(new PublicKey(wallet));
        return { wallet, balance: balance / LAMPORTS_PER_SOL };
      } catch {
        return { wallet, balance: 0 };
      }
    })
  );
  
  results.forEach(result => {
    balances[result.wallet] = result.balance;
  });
  
  return balances;
}

/**
 * Check which wallets need funding based on minimum threshold
 */
export async function getUnderfundedWallets(
  wallets: WalletWithRole[],
  minBalance: number,
  connection: Connection
): Promise<WalletWithRole[]> {
  const balances = await getWalletBalances(
    wallets.map(w => w.publicKey),
    connection
  );
  
  return wallets.filter(wallet => {
    const balance = balances[wallet.publicKey] || 0;
    return balance < minBalance && wallet.role !== 'master';
  });
}

/**
 * Distribute SOL randomly within specified range
 */
export function randomizeAmount(min: number, max: number): number {
  return min + Math.random() * (max - min);
} 