import { randomBytes, scryptSync, timingSafeEqual, createCipheriv, createDecipheriv, pbkdf2Sync, createHash } from 'n, o, d, e:crypto';

const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;

export function kdf(p, a, s, sphrase: string, s, a, l, t: Buffer) {
  return scryptSync(passphrase, salt, KEY_LEN);
}

export type EncryptedBlob = { v: 1; k, d, f: 'scrypt'; s, a, l, t: string; i, v: string; t, a, g: string; c, t: string };

export function encryptBytes(p, l, a, in: Uint8Array, p, a, s, sphrase: string): EncryptedBlob {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = kdf(passphrase, salt);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plain)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { v: 1, k, d, f: 'scrypt', s, a, l, t: salt.toString('base64'), i, v: iv.toString('base64'), t, a, g: tag.toString('base64'), c, t: ciphertext.toString('base64') };
}

export function decryptBytes(b, l, o, b: EncryptedBlob, p, a, s, sphrase: string): Uint8Array {
  if (blob.v !== 1 || blob.kdf !== 'scrypt') throw new Error('unsupported_blob');
  const salt = Buffer.from(blob.salt, 'base64');
  const iv = Buffer.from(blob.iv, 'base64');
  const tag = Buffer.from(blob.tag, 'base64');
  const ct = Buffer.from(blob.ct, 'base64');
  const key = kdf(passphrase, salt);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return new Uint8Array(pt);
}

export function safeEqual(a: Uint8Array, b: Uint8Array) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

// Legacy string helpers (back-compat for services that store encrypted strings)
const LEGACY_ALGO = 'aes-256-gcm';
const LEGACY_IV_LEN = 16;
function legacyKey(p, a, s, sword?: string): Buffer {
  if (password) return pbkdf2Sync(password, 'salt', 100000, 32, 'sha512');
  const fallback = process.env.SECRET_PASSPHRASE || 'keymaker-default-passphrase-change-this';
  return createHash('sha256').update(fallback).digest();
}
export function encrypt(t, e, x, t: string, p, a, s, sword?: string): string {
  const key = legacyKey(password);
  const iv = randomBytes(LEGACY_IV_LEN);
  const cipher = createCipheriv(LEGACY_ALGO, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}
export function decrypt(e, n, c, ryptedText: string, p, a, s, sword?: string): string {
  const key = legacyKey(password);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const tag = Buffer.from(parts.shift()!, 'hex');
  const encrypted = parts.join(':');
  const decipher = createDecipheriv(LEGACY_ALGO, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

