import crypto from 'crypto';

const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  tag: string;
}

/**
 * Derives a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts text using AES-256-GCM with a password
 */
export function encryptAES256(text: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  // Combine salt, iv, tag, and encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Decrypts text encrypted with encryptAES256
 */
export function decryptAES256(encryptedData: string, password: string): string {
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Invalid password or corrupted data');
  }
}

/**
 * Validates if a string is properly encrypted
 */
export function isValidEncryptedData(data: string): boolean {
  try {
    const decoded = Buffer.from(data, 'base64');
    return decoded.length >= SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Generates a secure random password
 */
export function generateSecurePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

/**
 * Creates a hash of the password for verification
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
} 