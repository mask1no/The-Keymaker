'use server';

interface TransactionLogData {
  action: 'buy' | 'sell' | 'transfer' | 'create';
  fromWallet?: string;
  toWallet?: string;
  tokenMint?: string;
  tokenSymbol?: string;
  amount?: number;
  price?: number;
  solAmount?: number;
  transactionHash?: string;
  volumeTaskId?: number;
  metadata?: Record<string, any>;
}

export async function logTransaction(data: TransactionLogData) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/transactions/log`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      console.error('Failed to log transaction:', await response.text());
    }

    return response.ok;
  } catch (error) {
    console.error('Error logging transaction:', error);
    return false;
  }
}

// Helper functions for common transaction types
export async function logBuyTransaction(params: {
  fromWallet: string;
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  solAmount: number;
  transactionHash?: string;
  volumeTaskId?: number;
}) {
  return logTransaction({
    action: 'buy',
    ...params,
  });
}

export async function logSellTransaction(params: {
  fromWallet: string;
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  solAmount: number;
  transactionHash?: string;
  volumeTaskId?: number;
}) {
  return logTransaction({
    action: 'sell',
    ...params,
  });
}

export async function logTokenCreation(params: {
  fromWallet: string;
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  transactionHash?: string;
}) {
  return logTransaction({
    action: 'create',
    ...params,
  });
}

export async function logTransferTransaction(params: {
  fromWallet: string;
  toWallet: string;
  tokenMint?: string;
  tokenSymbol?: string;
  amount: number;
  solAmount?: number;
  transactionHash?: string;
}) {
  return logTransaction({
    action: 'transfer',
    ...params,
  });
}
