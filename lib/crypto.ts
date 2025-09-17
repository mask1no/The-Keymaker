import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const SALT_LENGTH = 16

function scryptKey(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, 32)
}

function getDefaultKey(): Buffer {
  const passphrase = process.env.SECRET_PASSPHRASE || 'change-this-secret'
  return crypto.createHash('sha256').update(passphrase).digest()
}

// Encrypts a UTF-8 string. If password is provided, derives a key using scrypt+salt (v2 format).
// Otherwise uses server default key (v1.1 format without salt in envelope).
export function encrypt(plainText: string, password?: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  let key: Buffer
  let salt: Buffer | null = null
  if (password) {
    salt = crypto.randomBytes(SALT_LENGTH)
    key = scryptKey(password, salt)
  } else {
    key = getDefaultKey()
  }
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ct = Buffer.concat([cipher.update(Buffer.from(plainText, 'utf8')), cipher.final()])
  const tag = cipher.getAuthTag()
  if (salt) {
    // v2: salt.iv.tag.ciphertext (all base64url)
    return [salt, iv, tag, ct].map((b) => b.toString('base64url')).join('.')
  }
  // v1.1: iv:tag:ciphertext (hex), legacy support
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`
}

// Decrypts an envelope produced by encrypt(). Automatically detects legacy v1.1 (hex colon) vs v2 (base64url dot).
export function decrypt(encrypted: string, password?: string): string {
  // v2 format detection
  if (encrypted.includes('.')) {
    const [saltB64, ivB64, tagB64, ctB64] = encrypted.split('.')
    if (!saltB64 || !ivB64 || !tagB64 || !ctB64) throw new Error('Invalid envelope')
    const salt = Buffer.from(saltB64, 'base64url')
    const iv = Buffer.from(ivB64, 'base64url')
    const tag = Buffer.from(tagB64, 'base64url')
    const ct = Buffer.from(ctB64, 'base64url')
    if (!password) throw new Error('Password required for v2 envelope')
    const key = scryptKey(password, salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    const pt = Buffer.concat([decipher.update(ct), decipher.final()])
    return pt.toString('utf8')
  }

  // legacy v1.1 format iv:tag:ciphertext (hex), with optional password PBKDF2 legacy path
  const parts = encrypted.split(':')
  if (parts.length < 3) throw new Error('Invalid legacy envelope')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const tag = Buffer.from(parts.shift()!, 'hex')
  const ct = Buffer.from(parts.join(':'), 'hex')
  let key: Buffer
  if (password) {
    // keep legacy PBKDF2 compatibility for previously stored values
    key = crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha512')
  } else {
    key = getDefaultKey()
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString('utf8')
}
