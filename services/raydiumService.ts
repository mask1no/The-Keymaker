import { Connection, Keypair, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createInitializeMintInstruction, createAssociatedTokenAccountInstruction, createMintToInstruction, getMint } from '@solana/spl-token';
// import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
// Note: Install @metaplex-foundation/mpl-token-metadata for full metadata support
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';
import { logTokenLaunch } from './executionLogService';

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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
    
    // Create metadata account
    const metadataPDA = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    
    // Prepare metadata
    const tokenMetadata = {
      name: name.slice(0, 32), // Max 32 chars
      symbol: symbol.slice(0, 10), // Max 10 chars
      uri: metadata.image || '', // Should be uploaded to Arweave/IPFS
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null
    };
    
    // Create token metadata and mint supply transaction
    const metadataAndMintTx = new Transaction().add(
      createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: mint.publicKey,
          mintAuthority: authority.publicKey,
          payer: authority.publicKey,
          updateAuthority: authority.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: tokenMetadata,
            isMutable: true,
            collectionDetails: null
          }
        }
      ),
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
    
    metadataAndMintTx.recentBlockhash = blockhash;
    metadataAndMintTx.feePayer = authority.publicKey;
    metadataAndMintTx.sign(authority);
    
    const metadataAndMintSig = await connection.sendTransaction(metadataAndMintTx, [authority], {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    await connection.confirmTransaction(metadataAndMintSig, 'confirmed');
    
    // Log token launch
    await logTokenLaunch({
      tokenAddress: mint.publicKey.toBase58(),
      name,
      symbol,
      platform: 'Raydium',
      supply: supply.toString(),
      decimals,
      launcherWallet: authority.publicKey.toBase58(),
      transactionSignature: metadataAndMintSig
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
  tokenAmount: number,
  authority: Keypair
): Promise<string> {
  // Note: Full Raydium pool creation is complex and requires:
  // 1. Creating market on Serum
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