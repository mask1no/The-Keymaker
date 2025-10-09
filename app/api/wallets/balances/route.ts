import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// POST - Fetch multiple wallet balances
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { wallets, tokens = [] } = body;

    if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
      return NextResponse.json(
        { error: 'Wallets array is required' },
        { status: 400 }
      );
    }

    // Get RPC URL from environment
    const rpcUrl = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const results = await Promise.all(
      wallets.map(async (walletAddress: string) => {
        try {
          const walletPubkey = new PublicKey(walletAddress);

          // Get SOL balance
          const solBalance = await connection.getBalance(walletPubkey);
          const solBalanceSOL = solBalance / 1e9;

          const result: any = {
            wallet: walletAddress,
            sol: {
              balance: solBalanceSOL,
              balanceLamports: solBalance,
            },
            tokens: {},
          };

          // Get token balances if tokens are specified
          if (tokens.length > 0) {
            await Promise.all(
              tokens.map(async (tokenMint: string) => {
                try {
                  const tokenMintPubkey = new PublicKey(tokenMint);
                  const tokenAccount = await getAssociatedTokenAddress(tokenMintPubkey, walletPubkey);
                  
                  try {
                    const tokenAccountInfo = await getAccount(connection, tokenAccount);
                    result.tokens[tokenMint] = {
                      balance: Number(tokenAccountInfo.amount),
                      decimals: tokenAccountInfo.mint.toString(),
                    };
                  } catch (error) {
                    // Token account doesn't exist, balance is 0
                    result.tokens[tokenMint] = {
                      balance: 0,
                      decimals: 0,
                    };
                  }
                } catch (error) {
                  console.warn(`Invalid token mint: ${tokenMint}`);
                  result.tokens[tokenMint] = {
                    balance: 0,
                    decimals: 0,
                    error: 'Invalid token mint',
                  };
                }
              })
            );
          }

          return result;
        } catch (error) {
          return {
            wallet: walletAddress,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });

  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch wallet balances',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
