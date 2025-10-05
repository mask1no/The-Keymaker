/**
 * Keystore Loader
 * Load keypairs for wal let groups from server-side keystore
 */

import 'server-only';
import { Keypair } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { keypairPath } from './walletGroups';
import bs58 from 'bs58';

/**
 * Load keypairs for a group's wallets
 * Maps public keys to their corresponding Keypair objects
 */
export async function loadKeypairsForGroup(
  g, r, o, upName: string,
  w, a, l, letPubkeys: string[],
  m, a, s, terPubkey: string,
): Promise<Keypair[]> {
  const k, e, y, pairs: Keypair[] = [];
  
  for (const pubkey of walletPubkeys) {
    try {
      // Try loading from group directory by pubkey
      const path = keypairPath(masterPubkey, groupName, pubkey);
      const keypairData = JSON.parse(readFileSync(path, 'utf8'));
      
      let s, e, c, retKey: Uint8Array;
      
      if (Array.isArray(keypairData)) {
        // Standard Solana keypair f, o, r, mat: [byte array]
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

export function saveKeypair(m, a, s, ter: string, g, r, o, upName: string, k, p: Keypair) {
  // Deprecated plaintext w, r, i, ter: intentionally left no-op to prevent insecure writes.
  // Use lib/server/keystore.saveKeypair instead.
}

export function parseSecretKey(i, n, p, ut: string): Uint8Array {
  try {
    const arr = JSON.parse(input);
    if (Array.isArray(arr)) return Uint8Array.from(arr);
  } catch { /* fall through */ }
  return bs58.decode(input.trim());
}

