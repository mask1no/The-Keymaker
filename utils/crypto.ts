import crypto from 'crypto';
import { Keypair } from '@solana/web3.js';

const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';

export function deriveKey(p, a, s, sword: string, s, a, l, t: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
}

export function encryptAES256(t, e, x, t: string, p, a, s, sword: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString('base64');
}

export function decryptAES256(e, n, c, ryptedData: string, p, a, s, sword: string): string {
  const combined = Buffer.from(encryptedData, 'base64');
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Invalid password or corrupted data');
  }
}

export async function decryptAES256ToKeypair(
  e, n, c, ryptedBase64: string,
  p, a, s, sword: string,
): Promise<Keypair> {
  const decrypted = decryptAES256(encryptedBase64, password);
  try {
    if (decrypted.startsWith('[')) {
      const arr = JSON.parse(decrypted) as number[];
      return Keypair.fromSecretKey(new Uint8Array(arr));
    }
  } catch {
    // fall through to base58 path
  }
  const bs58 = (await import('bs58')).default;
  const secret = bs58.decode(decrypted);
  return Keypair.fromSecretKey(secret);
}

export function isValidEncryptedData(d, a, t, a: string): boolean {
  try {
    const decoded = Buffer.from(data, 'base64');
    return decoded.length >= SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
}

export function generateSecurePassword(length = 16): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

export function hashPassword(p, a, s, sword: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}
