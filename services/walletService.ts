import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import crypto from 'crypto';

interface WalletData {
  publicKey: string;
  encryptedPrivateKey: string;
  role: 'master' | 'dev' | 'sniper' | 'normal';
}

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt private key using AES-256-GCM
 */
export function encryptPrivateKey(privateKey: Uint8Array, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const privateKeyBase58 = bs58.encode(privateKey);
  
  const encrypted = Buffer.concat([
    cipher.update(privateKeyBase58, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Decrypt private key using AES-256-GCM
 */
export function decryptPrivateKey(encryptedData: string, password: string): Uint8Array {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  const privateKeyBase58 = decrypted.toString('utf8');
  return bs58.decode(privateKeyBase58);
}

/**
 * Create a new wallet with encrypted private key
 */
export async function createWallet(
  password: string, 
  role: 'master' | 'dev' | 'sniper' | 'normal' = 'normal'
): Promise<WalletData> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  const keypair = Keypair.generate();
  const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, password);
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    encryptedPrivateKey,
    role
  };
}

/**
 * Import wallet from private key
 */
export async function importWallet(
  privateKey: string,
  password: string,
  role: 'master' | 'dev' | 'sniper' | 'normal' = 'normal'
): Promise<WalletData> {
  try {
    // Handle different private key formats
    let keypair: Keypair;
    
    if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
      // Array format
      const keyArray = JSON.parse(privateKey);
      keypair = Keypair.fromSecretKey(new Uint8Array(keyArray));
    } else if (privateKey.length === 88 || privateKey.length === 87) {
      // Base58 format
      const decoded = bs58.decode(privateKey);
      keypair = Keypair.fromSecretKey(decoded);
    } else {
      throw new Error('Invalid private key format');
    }
    
    const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, password);
    
    return {
      publicKey: keypair.publicKey.toBase58(),
      encryptedPrivateKey,
      role
    };
  } catch (error) {
    throw new Error(`Failed to import wallet: ${(error as Error).message}`);
  }
}

/**
 * Export wallet with encrypted private key
 */
export async function exportWallet(
  walletData: WalletData,
  password: string
): Promise<string> {
  try {
    // Decrypt the private key
    const privateKey = decryptPrivateKey(walletData.encryptedPrivateKey, password);
    
    // Create export data
    const exportData = {
      publicKey: walletData.publicKey,
      privateKey: bs58.encode(privateKey),
      role: walletData.role,
      encrypted: false,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    throw new Error('Invalid password or corrupted wallet data');
  }
}

/**
 * Export wallet with re-encrypted private key (for backup)
 */
export async function exportWalletEncrypted(
  walletData: WalletData,
  currentPassword: string,
  exportPassword: string
): Promise<string> {
  try {
    // Decrypt with current password
    const privateKey = decryptPrivateKey(walletData.encryptedPrivateKey, currentPassword);
    
    // Re-encrypt with export password
    const reEncrypted = encryptPrivateKey(privateKey, exportPassword);
    
    const exportData = {
      publicKey: walletData.publicKey,
      encryptedPrivateKey: reEncrypted,
      role: walletData.role,
      encrypted: true,
      timestamp: new Date().toISOString(),
      algorithm: ENCRYPTION_ALGORITHM,
      iterations: ITERATIONS
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    throw new Error('Failed to export wallet: Invalid password');
  }
}

/**
 * Validate wallet password
 */
export async function validatePassword(
  encryptedPrivateKey: string,
  password: string
): Promise<boolean> {
  try {
    decryptPrivateKey(encryptedPrivateKey, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get keypair from encrypted wallet data
 */
export async function getKeypair(
  walletData: WalletData,
  password: string
): Promise<Keypair> {
  try {
    const privateKey = decryptPrivateKey(walletData.encryptedPrivateKey, password);
    return Keypair.fromSecretKey(privateKey);
  } catch (error) {
    throw new Error('Invalid password');
  }
}