import crypto from 'crypto'

// Get encryption key from environment or generate a default one
const getEncryptionKey = (): Buffer => {
  const passphrase =
    process.env.SECRET_PASSPHRASE ||
    process.env.NEXT_PUBLIC_SECRET_PASSPHRASE ||
    'keymaker-default-passphrase-change-this'
  // Derive a 32-byte key from the passphrase using SHA-256
  return crypto.createHash('sha256').update(passphrase).digest()
}

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 64

/**
 * Encrypts a string using AES-256-GCM
 * @param text The text to encrypt
 * @returns Base64 encoded encrypted string with format: salt:iv:tag:encrypted
 */
export function encrypt(text: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive key from passphrase and salt
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      100000,
      32,
      'sha256',
    )

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ])

    // Get the authentication tag
    const tag = cipher.getAuthTag()

    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted])

    // Return base64 encoded
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts a string encrypted with encrypt()
 * @param encryptedText Base64 encoded encrypted string
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedText, 'base64')

    // Extract components
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.slice(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH,
    )
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Derive key from passphrase and salt
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      100000,
      32,
      'sha256',
    )

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Validates that encryption/decryption is working properly
 */
export function validateEncryption(): boolean {
  try {
    const testString = 'test-encryption-validation'
    const encrypted = encrypt(testString)
    const decrypted = decrypt(encrypted)
    return decrypted === testString
  } catch {
    return false
  }
}

/**
 * Encrypts a Solana private key (base58 string)
 * @param privateKey Base58 encoded private key
 * @returns Encrypted private key
 */
export function encryptPrivateKey(privateKey: string): string {
  // Validate it's a valid base58 string of expected length
  if (!privateKey || privateKey.length < 87 || privateKey.length > 88) {
    throw new Error('Invalid private key format')
  }
  return encrypt(privateKey)
}

/**
 * Decrypts a Solana private key
 * @param encryptedKey Encrypted private key
 * @returns Base58 encoded private key
 */
export function decryptPrivateKey(encryptedKey: string): string {
  const decrypted = decrypt(encryptedKey)
  // Validate the decrypted key format
  if (!decrypted || decrypted.length < 87 || decrypted.length > 88) {
    throw new Error('Invalid decrypted private key format')
  }
  return decrypted
}
