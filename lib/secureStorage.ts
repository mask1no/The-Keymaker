/**
 * Secure storage system using key derivation
 * Private keys are NEVER stored - only derived from password when needed
 */

import crypto from 'crypto';
import { Keypair } from '@solana/web3.js';

// Increased iterations for better security
const PBKDF2_ITERATIONS = 600000; // 600k iterations as recommended
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

interface WalletMetadata {
  publicKey: string;
  role: 'master' | 'dev' | 'sniper' | 'normal';
  derivationPath: string; // For deterministic derivation
  createdAt: string;
}

interface SecureWalletGroup {
  id: string;
  name: string;
  masterSalt: string; // Group-specific salt
  wallets: WalletMetadata[];
  createdAt: string;
}

/**
 * Derive a master key from password and salt
 */
function deriveMasterKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Derive a wallet-specific key using HKDF
 */
function deriveWalletKey(masterKey: Buffer, walletPath: string): Buffer {
  const info = Buffer.from(`wallet:${walletPath}`, 'utf8');
  
  // HKDF expand
  const prk = crypto.createHmac('sha256', 'solana-wallet')
    .update(masterKey)
    .digest();
    
  return crypto.createHmac('sha256', prk)
    .update(info)
    .digest();
}

/**
 * Generate deterministic keypair from derived key
 */
function generateKeypairFromSeed(seed: Buffer): Keypair {
  // Use first 32 bytes as private key seed
  const privateKey = seed.slice(0, 32);
  
  // Generate keypair deterministically
  return Keypair.fromSeed(privateKey);
}

/**
 * Create a new wallet group with deterministic derivation
 */
export function createSecureWalletGroup(
  groupName: string
): SecureWalletGroup {
  const groupId = crypto.randomBytes(16).toString('hex');
  const masterSalt = crypto.randomBytes(SALT_LENGTH).toString('base64');
  
  return {
    id: groupId,
    name: groupName,
    masterSalt,
    wallets: [],
    createdAt: new Date().toISOString()
  };
}

/**
 * Add a wallet to a group (deterministically derived)
 */
export function addWalletToGroup(
  group: SecureWalletGroup,
  password: string,
  role: WalletMetadata['role']
): WalletMetadata {
  const walletIndex = group.wallets.length;
  const derivationPath = `m/44'/501'/${walletIndex}'/0'`; // BIP44-like path
  
  // Derive the wallet to get public key
  const salt = Buffer.from(group.masterSalt, 'base64');
  const masterKey = deriveMasterKey(password, salt);
  const walletKey = deriveWalletKey(masterKey, derivationPath);
  const keypair = generateKeypairFromSeed(walletKey);
  
  const metadata: WalletMetadata = {
    publicKey: keypair.publicKey.toBase58(),
    role,
    derivationPath,
    createdAt: new Date().toISOString()
  };
  
  return metadata;
}

/**
 * Derive keypair for a specific wallet
 */
export function deriveKeypair(
  group: SecureWalletGroup,
  walletMetadata: WalletMetadata,
  password: string
): Keypair {
  const salt = Buffer.from(group.masterSalt, 'base64');
  const masterKey = deriveMasterKey(password, salt);
  const walletKey = deriveWalletKey(masterKey, walletMetadata.derivationPath);
  
  return generateKeypairFromSeed(walletKey);
}

/**
 * Derive multiple keypairs efficiently
 */
export function deriveKeypairs(
  group: SecureWalletGroup,
  wallets: WalletMetadata[],
  password: string
): Keypair[] {
  const salt = Buffer.from(group.masterSalt, 'base64');
  const masterKey = deriveMasterKey(password, salt);
  
  return wallets.map(wallet => {
    const walletKey = deriveWalletKey(masterKey, wallet.derivationPath);
    return generateKeypairFromSeed(walletKey);
  });
}

/**
 * Store group metadata in IndexedDB (not localStorage)
 */
export async function saveGroupMetadata(group: SecureWalletGroup): Promise<void> {
  if (typeof window === 'undefined') return;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KeymakerSecure', 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['groups'], 'readwrite');
      const store = transaction.objectStore('groups');
      
      store.put(group);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to save group'));
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('groups')) {
        db.createObjectStore('groups', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Load group metadata from IndexedDB
 */
export async function loadGroupMetadata(groupId: string): Promise<SecureWalletGroup | null> {
  if (typeof window === 'undefined') return null;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KeymakerSecure', 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['groups'], 'readonly');
      const store = transaction.objectStore('groups');
      const getRequest = store.get(groupId);
      
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(new Error('Failed to load group'));
    };
  });
}

/**
 * Export group with secure encryption
 */
export function exportSecureGroup(
  group: SecureWalletGroup,
  exportPassword: string
): string {
  const exportSalt = crypto.randomBytes(SALT_LENGTH);
  const exportKey = deriveMasterKey(exportPassword, exportSalt);
  
  // Encrypt the group data
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', exportKey, iv);
  
  const groupData = JSON.stringify(group);
  const encrypted = Buffer.concat([
    cipher.update(groupData, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  // Combine all parts
  const exportData = {
    version: '2.0',
    algorithm: 'aes-256-gcm',
    iterations: PBKDF2_ITERATIONS,
    salt: exportSalt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64')
  };
  
  return JSON.stringify(exportData);
}

/**
 * Import group from secure export
 */
export function importSecureGroup(
  exportedData: string,
  importPassword: string
): SecureWalletGroup {
  const parsed = JSON.parse(exportedData);
  
  if (parsed.version !== '2.0') {
    throw new Error('Unsupported export version');
  }
  
  const salt = Buffer.from(parsed.salt, 'base64');
  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const encrypted = Buffer.from(parsed.data, 'base64');
  
  const importKey = deriveMasterKey(importPassword, salt);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', importKey, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length < 12) {
    feedback.push('Password should be at least 12 characters');
  } else {
    score += 2;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include uppercase letters');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Include lowercase letters');
  } else {
    score += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Include numbers');
  } else {
    score += 1;
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Include special characters');
  } else {
    score += 1;
  }
  
  // Check for common patterns
  const commonPatterns = ['password', '12345', 'qwerty', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    feedback.push('Avoid common passwords');
    score = Math.max(0, score - 2);
  }
  
  return {
    valid: score >= 4,
    score,
    feedback
  };
} 