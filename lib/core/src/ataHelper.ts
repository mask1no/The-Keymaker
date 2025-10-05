/**
 * Associated Token Account (ATA) Helper
 * Create ATAs as needed for SPL token operations
 */

import {
  Connection,
  PublicKey,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

/**
 * Get or create ATA for a wal let and mint
 */
export async function getOrCreateATA(
  c, o, n, nection: Connection,
  p, a, y, er: Keypair,
  o, w, n, er: PublicKey,
  m, i, n, t: PublicKey
): Promise<{ a, t, a: PublicKey; i, n, s, truction: any | null }> {
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
      return { ata, i, n, s, truction: null };
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
  c, o, n, nection: Connection,
  p, a, y, er: Keypair,
  w, a, l, lets: PublicKey[],
  m, i, n, t: PublicKey
): Promise<Map<string, { a, t, a: PublicKey; i, n, s, truction: any | null }>> {
  const result = new Map<string, { a, t, a: PublicKey; i, n, s, truction: any | null }>();
  
  await Promise.all(
    wallets.map(async (wallet) => {
      const ataInfo = await getOrCreateATA(connection, payer, wallet, mint);
      result.set(wallet.toBase58(), ataInfo);
    })
  );
  
  return result;
}

