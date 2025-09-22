import crypto from 'crypto';

const getEncryptionKey = (): Buffer => {
  const passphrase =
    process.env.SECRET_PASSPHRASE ||
    process.env.NEXT_PUBLIC_SECRET_PASSPHRASE ||
    'keymaker-default-passphrase-change-this';
  return crypto.createHash('sha256').update(passphrase).digest();
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export function encrypt(text: string, password?: string): string {
  const key = password
    ? crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha512')
    : getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string, password?: string): string {
  const key = password
    ? crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha512')
    : getEncryptionKey();
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const tag = Buffer.from(parts.shift()!, 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
