/**
 * Associated Token Account (ATA) Helper
 * Create ATAs as needed for SPL token operations
 */

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

/**
 * Get or create ATA for a wallet and mint
 */
export async function getOrCreateATA(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey
): Promise<{ ata: PublicKey; instruction: any | null }> {
  // Derive ATA address
  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Check if ATA exists
  try {
    const account = await connection.getAccountInfo(ata);
    
    if (account) {
      // ATA already exists
      return { ata, instruction: null };
    }
  } catch (error) {
    // Account doesn't exist, we'll create it
  }
  
  // Create ATA instruction
  const instruction = createAssociatedTokenAccountInstruction(
    payer.publicKey,   // payer
    ata,               // associated token account
    owner,             // owner
    mint,              // mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  return { ata, instruction };
}

/**
 * Build ATAs for multiple wallets
 */
export async function buildATAsForWallets(
  connection: Connection,
  payer: Keypair,
  wallets: PublicKey[],
  mint: PublicKey
): Promise<Map<string, { ata: PublicKey; instruction: any | null }>> {
  const result = new Map<string, { ata: PublicKey; instruction: any | null }>();
  
  await Promise.all(
    wallets.map(async (wallet) => {
      const ataInfo = await getOrCreateATA(connection, payer, wallet, mint);
      result.set(wallet.toBase58(), ataInfo);
    })
  );
  
  return result;
}
