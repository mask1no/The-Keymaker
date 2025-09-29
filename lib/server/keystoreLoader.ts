/**
 * Keystore Loader
 * Load keypairs for wallet groups from server-side keystore
 */

import 'server-only';
import { Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import bs58 from 'bs58';

/**
 * Load keypairs for a group's wallets
 * Maps public keys to their corresponding Keypair objects
 */
export async function loadKeypairsForGroup(
  groupName: string,
  walletPubkeys: string[]
): Promise<Keypair[]> {
  const keypairs: Keypair[] = [];
  const groupDir = join(process.cwd(), 'keypairs', groupName);
  
  for (const pubkey of walletPubkeys) {
    try {
      // Try loading from group directory by pubkey
      const keypairPath = join(groupDir, `${pubkey}.json`);
      const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
      
      let secretKey: Uint8Array;
      
      if (Array.isArray(keypairData)) {
        // Standard Solana keypair format: [byte array]
        secretKey = new Uint8Array(keypairData);
      } else if (typeof keypairData === 'string') {
        // Base58 encoded secret key
        secretKey = bs58.decode(keypairData);
      } else if (keypairData.secretKey) {
        // Object with secretKey field
        if (Array.isArray(keypairData.secretKey)) {
          secretKey = new Uint8Array(keypairData.secretKey);
        } else {
          secretKey = bs58.decode(keypairData.secretKey);
        }
      } else {
        throw new Error('Unknown keypair format');
      }
      
      const keypair = Keypair.fromSecretKey(secretKey);
      
      // Verify public key matches
      if (keypair.publicKey.toBase58() !== pubkey) {
        throw new Error(`Public key mismatch for ${pubkey}`);
      }
      
      keypairs.push(keypair);
    } catch (error) {
      console.error(`Failed to load keypair for ${pubkey}:`, error);
      // Continue with other wallets
    }
  }
  
  return keypairs;
}

/**
 * Load single keypair by public key
 */
export async function loadKeypair(groupName: string, pubkey: string): Promise<Keypair | null> {
  const keypairs = await loadKeypairsForGroup(groupName, [pubkey]);
  return keypairs[0] || null;
}
