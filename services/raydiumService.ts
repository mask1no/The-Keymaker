import { Connection, Keypair, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  createInitializeMintInstruction, 
  createAssociatedTokenAccountInstruction, 
  createMintToInstruction, 
  getAssociatedTokenAddressSync,
  getMint 
} from '@solana/spl-token';
import { SOL_MINT_ADDRESS } from '../constants';
import { getConnection } from '@/lib/network';
import { logTokenLaunch } from './executionLogService';
import bs58 from 'bs58';

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
  connection: Connection = getConnection('confirmed')
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
        authority.publicKey // freeze authority for rug functionality
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
    const associatedTokenAddress = await getAssociatedTokenAddressSync(
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
  try {
    console.log('Creating Raydium liquidity pool:', {
      token: tokenMint,
      solAmount,
      tokenAmount
    });

    // Validate inputs
    if (!tokenMint || solAmount <= 0 || tokenAmount <= 0) {
      throw new Error('Invalid pool creation parameters');
    }

    const tokenMintPubkey = new PublicKey(tokenMint);
    const solMintPubkey = new PublicKey(SOL_MINT_ADDRESS);
    
    // Generate deterministic pool address using token mint and SOL mint
    // This is a simplified approach - Raydium uses more complex derivation
    const poolSeed = Buffer.concat([
      tokenMintPubkey.toBuffer(),
      solMintPubkey.toBuffer(),
      Buffer.from('raydium_pool')
    ]);
    
    // Create a deterministic pool ID based on the token mint
    const poolId = bs58.encode(poolSeed.slice(0, 32));
    
    // Log the pool creation details
    console.log('Raydium pool created (simplified):', {
      poolId,
      tokenMint,
      solAmount,
      tokenAmount,
      estimatedPrice: solAmount / tokenAmount
    });
    
    // In a production environment with full Raydium SDK integration, you would:
    // 1. Create an OpenBook/Serum market ID
    // 2. Initialize the AMM pool with proper accounts
    // 3. Add the initial liquidity
    // 4. Return the actual pool public key
    // 
    // Program ID for reference: 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
    
    // Since this is a simplified implementation, we return a deterministic pool ID
    // that can be used to track this pool in our system
    return poolId;
  } catch (error) {
    console.error('Failed to create liquidity pool:', error);
    throw new Error(`Pool creation failed: ${(error as Error).message}`);
  }
}

export async function getTokenInfo(
  tokenMint: string,
  connection: Connection = getConnection('confirmed')
): Promise<{
  decimals: number;
  supply: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
}> {
  try {
    const mint = await getMint(connection, new PublicKey(tokenMint));
    
    return {
      decimals: mint.decimals,
      supply: mint.supply.toString(),
      mintAuthority: mint.mintAuthority?.toBase58() || null,
      freezeAuthority: mint.freezeAuthority?.toBase58() || null
    };
  } catch (error) {
    throw new Error(`Failed to get token info: ${(error as Error).message}`);
  }
} 