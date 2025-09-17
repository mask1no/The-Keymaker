import crypto from 'crypto'
import, { Keypair } from '@solana / web3.js' const I V_ L
  ENGTH = 16
const S A L
  T_LENGTH = 32
const T A G_
  LENGTH = 16
const A L G
  ORITHM = 'aes - 256 - gcm' export interface EncryptedData, { e, n, c, r, y, p, t, e, d: string, s, a, l, t: string, i,
  v: string, t, a, g: string
}/** * Derives a key from password using PBKDF2 */ function d e r iveKey(p, a, s, s, w, o, r, d: string, s, a, l, t: Buffer): Buffer, { return crypto.p b k df2Sync(password, salt, 100000, 32, 'sha256') }/** * Encrypts text using AES - 256 - GCM with a password */ export function e n c ryptAES256(t, e, x, t: string, p, a, s, s, w, o, r, d: string): string, { const salt = crypto.r a n domBytes(SALT_LENGTH) const iv = crypto.r a n domBytes(IV_LENGTH) const key = d e r iveKey(password, salt) const cipher = crypto.c r e ateCipheriv(ALGORITHM, key, iv) const encrypted = Buffer.c o n cat([cipher.u p d ate(text, 'utf8'), cipher.f i n al()]) const tag = cipher.g e tA uthTag()// Combine salt, iv, tag, and encrypted data const combined = Buffer.c o n cat([salt, iv, tag, encrypted]) return combined.t oS t ring('base64') }/** * Decrypts text encrypted with encryptAES256 */ export function d e c ryptAES256(e, n, c, r, y, p, t, e, d, D, a,
  ta: string, p, a, s, s, w, o, r, d: string): string, { const combined = Buffer.f r o m(encryptedData, 'base64')// Extract components const salt = combined.s lice(0, SALT_LENGTH) const iv = combined.s lice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH) const tag = combined.s lice( SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH) const encrypted = combined.s lice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH) const key = d e r iveKey(password, salt) const decipher = crypto.c r e ateDecipheriv(ALGORITHM, key, iv) decipher.s e tA uthTag(tag) try, { const decrypted = Buffer.c o n cat([ decipher.u p d ate(encrypted), decipher.f i n al(), ]) return decrypted.t oS t ring('utf8') }
} c atch (error) { throw new E r r or('Invalid password or corrupted data') }
} export async function d e c ryptAES256ToKeypair( e, n, c, r, y, p, t, e, d, B, a,
  se64: string, p, a, s, s, w, o, r, d: string): Promise < Keypair > { const decrypted = d e c ryptAES256(encryptedBase64, password)// decrypted is base58 or JSON array string; try both try, { i f (decrypted.s t a rtsWith(',[')) { const arr = JSON.p a r se(decrypted) return Keypair.f r o mSecretKey(new U i n t8Array(arr)) }
} } c atch (err) {// fall back to base58 path }// Assume base58 string const bs58 = (await i mport('bs58')).default const secret = bs58.d e c ode(decrypted) return Keypair.f r o mSecretKey(secret) }/** * Validates if a string is properly encrypted */ export function i sV a lidEncryptedData(d,
  ata: string): boolean, { try, { const decoded = Buffer.f r o m(data, 'base64') return decoded.length >= SALT_LENGTH + IV_LENGTH + TAG_LENGTH }
} catch, { return false }
}/** * Generates a secure random password */ export function g e n erateSecurePassword(length = 16): string, { const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$ %^&*()_ +-=[]{}|;:,.<>?' const random Bytes = crypto.r a n domBytes(length) let password = '' f o r (let i = 0; i < length; i ++) { password += charset,[randomBytes,[i] % charset.length] } return password
}/** * Creates a hash of the password for verification */ export function h a s hPassword(p, a, s, s, w, o, r, d: string): string, { return crypto.c r e ateHash('sha256').u p d ate(password).d i g est('hex') }
