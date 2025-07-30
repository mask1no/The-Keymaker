import { Connection, Keypair, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createInitializeMintInstruction, createAssociatedTokenAccountInstruction, createMintToInstruction, getMint } from '@solana/spl-token';
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';
import { logTokenLaunch } from './executionLogService';

type TokenMetadata = { 
  name: string; 
  symbol: string; 
  description?: string;
  image?: string;
  telegram?: string;
  website?: string;
  twitter?: string;
};

export async function createToken(
  name: string, 
  symbol: string, 
  supply: number, 
  metadata: TokenMetadata, 
  authority: Keypair, 
  connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
): Promise<string> {
  try {
    // Create mint account
    const mint = Keypair.generate();
    const decimals = 9; // Standard SPL token decimals
    
    // Calculate rent
    const mintRent = await connection.getMinimumBalanceForRentExemption(82);
    
    // Create mint account transaction
    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: mintRent,
        space: 82,
        programId: TOKEN_PROGRAM_ID
      }),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        authority.publicKey,
        null // No freeze authority
      )
    );
    
    // Send create mint transaction
    const { blockhash } = await connection.getLatestBlockhash();
    createMintTx.recentBlockhash = blockhash;
    createMintTx.feePayer = authority.publicKey;
    createMintTx.sign(authority, mint);
    
    const createMintSig = await connection.sendTransaction(createMintTx, [authority, mint], {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    await connection.confirmTransaction(createMintSig, 'confirmed');
    
    // Get/Create associated token account
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mint.publicKey,
      authority.publicKey
    );
    
    // Create associated token account and mint supply
    const mintTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        associatedTokenAddress,
        authority.publicKey,
        mint.publicKey
      ),
      createMintToInstruction(
        mint.publicKey,
        associatedTokenAddress,
        authority.publicKey,
        supply * Math.pow(10, decimals)
      )
    );
    
    mintTx.recentBlockhash = blockhash;
    mintTx.feePayer = authority.publicKey;
    mintTx.sign(authority);
    
    const mintSig = await connection.sendTransaction(mintTx, [authority], {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    await connection.confirmTransaction(mintSig, 'confirmed');
    
    // Log token launch
    await logTokenLaunch({
      tokenAddress: mint.publicKey.toBase58(),
      name,
      symbol,
      platform: 'Raydium',
      supply: supply.toString(),
      decimals,
      launcherWallet: authority.publicKey.toBase58(),
      transactionSignature: mintSig
    });
    
    // Token created successfully - metadata requires @metaplex-foundation/mpl-token-metadata package
    
    return mint.publicKey.toBase58();
  } catch (error) {
    console.error('Failed to create token:', error);
    throw new Error(`Token creation failed: ${(error as Error).message}`);
  }
}

export async function createLiquidityPool(
  tokenMint: string, 
  solAmount: number, 
  tokenAmount: number
): Promise<string> {
  // Note: Full Raydium pool creation is complex and requires:
  // 1. Creating market on Serum/OpenBook
  // 2. Creating AMM pool
  // 3. Adding initial liquidity
  // This is a simplified placeholder - use Raydium SDK for production
  
  try {
    console.log('Creating liquidity pool:', {
      token: tokenMint,
      solAmount,
      tokenAmount
    });
    
    // In production, you would:
    // 1. Use @raydium-io/raydium-sdk
    // 2. Create OpenBook market
    // 3. Initialize AMM pool
    // 4. Add liquidity
    
    // For now, return a placeholder
    return `raydium_pool_${tokenMint.slice(0, 8)}`;
  } catch (error) {
    console.error('Failed to create liquidity pool:', error);
    throw new Error(`Pool creation failed: ${(error as Error).message}`);
  }
}

export async function getTokenInfo(
  tokenMint: string,
  connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
): Promise<{
  decimals: number;
  supply: string;
  mintAuthority: string | null;
}> {
  try {
    const mint = await getMint(connection, new PublicKey(tokenMint));
    
    return {
      decimals: mint.decimals,
      supply: mint.supply.toString(),
      mintAuthority: mint.mintAuthority?.toBase58() || null
    };
  } catch (error) {
    throw new Error(`Failed to get token info: ${(error as Error).message}`);
  }
} 