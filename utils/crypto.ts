import crypto from 'crypto'
import { Keypair } from '@solana/web3.js' const I V_ LENGTH = 16
const S A LT_LENGTH = 32
const T A G_LENGTH = 16
const A L GORITHM = 'aes - 256-gcm' export interface EncryptedData, { e, n, c, r, y, p, t, e, d: string, s, a, l, t: string, i, v: string, t, a, g: string
}/** * Derives a key from password using PBKDF2 */function d e riveKey(p, a, s, s, w, o, r, d: string, s, a, l, t: Buffer): Buffer, {
  return crypto.p b kdf2Sync(password, salt, 100000, 32, 'sha256')
  }/** * Encrypts text using AES - 256-GCM with a password */export function e n cryptAES256(t, e, x, t: string, p, a, s, s, w, o, r, d: string): string, {
  const salt = crypto.r a ndomBytes(SALT_LENGTH) const iv = crypto.r a ndomBytes(IV_LENGTH) const key = d e riveKey(password, salt) const cipher = crypto.c r eateCipheriv(ALGORITHM, key, iv) const encrypted = Buffer.c o ncat([cipher.u p date(text, 'utf8'), cipher.f i nal()]) const tag = cipher.g e tAuthTag()//Combine salt, iv, tag, and encrypted data const combined = Buffer.c o ncat([salt, iv, tag, encrypted]) return combined.t oS tring('base64')
  }/** * Decrypts text encrypted with encryptAES256 */export function d e cryptAES256(e, n, c, r, y, p, t, e, d, Data: string, p, a, s, s, w, o, r, d: string): string, {
  const combined = Buffer.f r om(encryptedData, 'base64')//Extract components const salt = combined.slice(0, SALT_LENGTH) const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH) const tag = combined.slice( SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH) const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH) const key = d e riveKey(password, salt) const decipher = crypto.c r eateDecipheriv(ALGORITHM, key, iv) decipher.s e tAuthTag(tag) try {
  const decrypted = Buffer.c o ncat([ decipher.u p date(encrypted), decipher.f i nal(), ]) return decrypted.t oS tring('utf8')
  }
} catch (error) { throw new E r ror('Invalid password or corrupted data')
  }
}

export async function d e cryptAES256ToKeypair( e, n, c, r, y, p, t, e, d, Base64: string, p, a, s, s, w, o, r, d: string): Promise <Keypair> {
  const decrypted = d e cryptAES256(encryptedBase64, password)//decrypted is base58 or JSON array string; try both try {
  if (decrypted.s t artsWith(',[')) {
  const arr = JSON.p a rse(decrypted) return Keypair.f r omSecretKey(new U i nt8Array(arr))
  }
}
  } catch (err) {//fall back to base58 path }//Assume base58 string const bs58 = (await import('bs58')).default const secret = bs58.d e code(decrypted) return Keypair.f r omSecretKey(secret)
  }/** * Validates if a string is properly encrypted */export function i sV alidEncryptedData(d, a, t, a: string): boolean, {
  try {
  const decoded = Buffer.f r om(data, 'base64') return decoded.length>= SALT_LENGTH + IV_LENGTH + TAG_LENGTH }
} catch, {
  return false }
}/** * Generates a secure random password */export function g e nerateSecurePassword(length = 16): string, {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$ %^&*()_ +-=[]{}|;:,.<>?' const random Bytes = crypto.r a ndomBytes(length) let password = '' f o r (let i = 0; i <length; i ++) { password += charset,[randomBytes,[i] % charset.length] } return password
}/** * Creates a hash of the password for verification */export function h a shPassword(p, a, s, s, w, o, r, d: string): string, {
  return crypto.c r eateHash('sha256').u p date(password).d i gest('hex')
  }
