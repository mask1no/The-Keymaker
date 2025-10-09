import 'server-only';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction,
  createInitializeMetadataAccountV3Instruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';
import { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

// Pump.fun program ID (this is a placeholder - you'll need the actual program ID)
const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

interface CreateMintParams {
  master: Keypair;
  name: string;
  symbol: string;
  uri: string;
  connection: Connection;
  decimals?: number;
  supply?: number;
}

interface BuyOnCurveParams {
  buyer: Keypair;
  mint: PublicKey;
  solLamports: number;
  slippageBps: number;
  connection: Connection;
  priorityFeeMicroLamports?: number;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export async function buildCreateMintTx(params: CreateMintParams): Promise<VersionedTransaction> {
  const { master, name, symbol, uri, connection, decimals = 9, supply = 1000000000 } = params;
  
  try {
    // Generate a new keypair for the mint
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    
    // Calculate required lamports for rent exemption
    const mintRent = await getMinimumBalanceForRentExemptMint(connection);
    
    // Create metadata URI (you might want to upload to IPFS first)
    const metadata: TokenMetadata = {
      name,
      symbol,
      description: `A memecoin created with The Keymaker`,
      image: uri,
    };
    
    const instructions = [];
    
    // 1. Create the mint account
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: master.publicKey,
        newAccountPubkey: mint,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // 2. Initialize the mint
    instructions.push(
      createInitializeMintInstruction(
        mint,
        decimals,
        master.publicKey, // mint authority
        master.publicKey  // freeze authority
      )
    );
    
    // 3. Create metadata account
    const metadataAccount = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];
    
    instructions.push(
      createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataAccount,
          mint: mint,
          mintAuthority: master.publicKey,
          payer: master.publicKey,
          updateAuthority: master.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: metadata.name,
              symbol: metadata.symbol,
              uri: uri,
              sellerFeeBasisPoints: 0,
              creators: [{
                address: master.publicKey,
                verified: true,
                share: 100,
              }],
              collection: null,
              uses: null,
            },
            isMutable: true,
            collectionDetails: null,
          },
        }
      )
    );
    
    // 4. Create associated token account for the creator
    const creatorTokenAccount = await getAssociatedTokenAddress(mint, master.publicKey);
    instructions.push(
      createAssociatedTokenAccountInstruction(
        master.publicKey, // payer
        creatorTokenAccount, // ata
        master.publicKey, // owner
        mint // mint
      )
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create transaction message
    const messageV0 = new TransactionMessage({
      payerKey: master.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();
    
    // Create versioned transaction
    const transaction = new VersionedTransaction(messageV0);
    
    // Sign with both keypairs
    transaction.sign([master, mintKeypair]);
    
    return transaction;
    
  } catch (error) {
    console.error('Error building create mint transaction:', error);
    throw new Error(`Failed to build create mint transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function buildBuyOnCurveTx(params: BuyOnCurveParams): Promise<VersionedTransaction> {
  const { buyer, mint, solLamports, slippageBps, connection, priorityFeeMicroLamports = 10000 } = params;
  
  try {
    // This is a simplified implementation
    // In reality, you'd need to interact with pump.fun's bonding curve program
    
    const instructions = [];
    
    // For now, we'll create a basic transfer instruction
    // You'll need to replace this with actual pump.fun curve interaction
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: buyer.publicKey,
        toPubkey: mint, // This should be the pump.fun program's curve account
        lamports: solLamports,
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create transaction message
    const messageV0 = new TransactionMessage({
      payerKey: buyer.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();
    
    // Create versioned transaction
    const transaction = new VersionedTransaction(messageV0);
    
    // Sign with buyer keypair
    transaction.sign([buyer]);
    
    return transaction;
    
  } catch (error) {
    console.error('Error building buy on curve transaction:', error);
    throw new Error(`Failed to build buy on curve transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCurvePrice(mint: PublicKey, connection: Connection): Promise<number> {
  try {
    // This is a placeholder implementation
    // You'll need to fetch the actual price from pump.fun's bonding curve
    
    // For now, return a mock price
    return 0.000001; // 0.000001 SOL per token
    
  } catch (error) {
    console.error('Error getting curve price:', error);
    throw new Error(`Failed to get curve price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to upload metadata to IPFS (you'll need to implement this)
export async function uploadMetadataToIPFS(metadata: TokenMetadata): Promise<string> {
  try {
    // This is a placeholder - you'll need to implement actual IPFS upload
    // You can use services like Pinata, NFT.Storage, or your own IPFS node
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY || '',
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || '',
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name} - ${metadata.symbol}`,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload to IPFS');
    }
    
    const result = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    // Fallback to a placeholder URI
    return 'https://via.placeholder.com/500x500.png';
  }
}
