import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// GET - Fetch wallet balances
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const tokenMint = searchParams.get('token');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get RPC URL from environment
    const rpcUrl = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const walletPubkey = new PublicKey(walletAddress);

    // Get SOL balance
    const solBalance = await connection.getBalance(walletPubkey);
    const solBalanceSOL = solBalance / 1e9; // Convert lamports to SOL

    const result: any = {
      wallet: walletAddress,
      sol: {
        balance: solBalanceSOL,
        balanceLamports: solBalance,
      },
    };

    // If token mint is specified, get token balance
    if (tokenMint) {
      try {
        const tokenMintPubkey = new PublicKey(tokenMint);
        const tokenAccount = await getAssociatedTokenAddress(tokenMintPubkey, walletPubkey);
        
        try {
          const tokenAccountInfo = await getAccount(connection, tokenAccount);
          result.token = {
            mint: tokenMint,
            balance: Number(tokenAccountInfo.amount),
            decimals: tokenAccountInfo.mint.toString(),
          };
        } catch (error) {
          // Token account doesn't exist, balance is 0
          result.token = {
            mint: tokenMint,
            balance: 0,
            decimals: 0,
          };
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid token mint address' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch wallet balance',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
