import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import crypto from 'crypto'
import path from 'path'

interface WalletData {
  publicKey: string
  encryptedPrivateKey: string
  role: 'master' | 'dev' | 'sniper' | 'normal'
}

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt private key using AES-256-GCM
 */
export function encryptPrivateKey(
  privateKey: Uint8Array,
  password: string,
): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(password, salt)

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  const privateKeyBase58 = bs58.encode(privateKey)

  const encrypted = Buffer.concat([
    cipher.update(privateKeyBase58, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted])

  return combined.toString('base64')
}

/**
 * Decrypt private key using AES-256-GCM
 */
export function decryptPrivateKey(
  encryptedData: string,
  password: string,
): Uint8Array {
  const combined = Buffer.from(encryptedData, 'base64')

  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = combined.slice(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH,
  )
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

  const key = deriveKey(password, salt)

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  const privateKeyBase58 = decrypted.toString('utf8')
  return bs58.decode(privateKeyBase58)
}

/**
 * Create a new wallet with encrypted private key
 */
export async function createWallet(
  password: string,
  role: 'master' | 'dev' | 'sniper' | 'normal' = 'normal',
): Promise<WalletData> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const keypair = Keypair.generate()
  const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, password)

  return {
    publicKey: keypair.publicKey.toBase58(),
    encryptedPrivateKey,
    role,
  }
}

/**
 * Import wallet from private key
 */
export async function importWallet(
  privateKey: string,
  password: string,
  role: 'master' | 'dev' | 'sniper' | 'normal' = 'normal',
): Promise<WalletData> {
  try {
    // Handle different private key formats
    let keypair: Keypair

    if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
      // Array format
      const keyArray = JSON.parse(privateKey)
      keypair = Keypair.fromSecretKey(new Uint8Array(keyArray))
    } else if (privateKey.length === 88 || privateKey.length === 87) {
      // Base58 format
      const decoded = bs58.decode(privateKey)
      keypair = Keypair.fromSecretKey(decoded)
    } else {
      throw new Error('Invalid private key format')
    }

    const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, password)

    return {
      publicKey: keypair.publicKey.toBase58(),
      encryptedPrivateKey,
      role,
    }
  } catch (error) {
    throw new Error(`Failed to import wallet: ${(error as Error).message}`)
  }
}

/**
 * Export wallet with encrypted private key
 */
export async function exportWallet(
  walletData: WalletData,
  password: string,
): Promise<string> {
  try {
    // Decrypt the private key
    const privateKey = decryptPrivateKey(
      walletData.encryptedPrivateKey,
      password,
    )

    // Create export data
    const exportData = {
      publicKey: walletData.publicKey,
      privateKey: bs58.encode(privateKey),
      role: walletData.role,
      encrypted: false,
      timestamp: new Date().toISOString(),
    }

    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    throw new Error('Invalid password or corrupted wallet data')
  }
}

/**
 * Export wallet with re-encrypted private key (for backup)
 */
export async function exportWalletEncrypted(
  walletData: WalletData,
  currentPassword: string,
  exportPassword: string,
): Promise<string> {
  try {
    // Decrypt with current password
    const privateKey = decryptPrivateKey(
      walletData.encryptedPrivateKey,
      currentPassword,
    )

    // Re-encrypt with export password
    const reEncrypted = encryptPrivateKey(privateKey, exportPassword)

    const exportData = {
      publicKey: walletData.publicKey,
      encryptedPrivateKey: reEncrypted,
      role: walletData.role,
      encrypted: true,
      timestamp: new Date().toISOString(),
      algorithm: ENCRYPTION_ALGORITHM,
      iterations: ITERATIONS,
    }

    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    throw new Error('Failed to export wallet: Invalid password')
  }
}

/**
 * Validate wallet password
 */
export async function validatePassword(
  encryptedPrivateKey: string,
  password: string,
): Promise<boolean> {
  try {
    decryptPrivateKey(encryptedPrivateKey, password)
    return true
  } catch {
    return false
  }
}

/**
 * Get keypair from encrypted wallet data
 */
export async function getKeypair(
  walletData: WalletData,
  password: string,
): Promise<Keypair> {
  try {
    const privateKey = decryptPrivateKey(
      walletData.encryptedPrivateKey,
      password,
    )
    return Keypair.fromSecretKey(privateKey)
  } catch (error) {
    throw new Error('Invalid password')
  }
}

/**
 * Get multiple keypairs for bundle signing
 */
export async function getKeypairs(
  walletsData: WalletData[],
  password: string,
): Promise<Keypair[]> {
  try {
    return Promise.all(
      walletsData.map((wallet) => getKeypair(wallet, password)),
    )
  } catch (error) {
    throw new Error('Failed to decrypt wallets: Invalid password')
  }
}

/**
 * Get keypairs for specific roles
 */
export async function getKeypairsByRole(
  walletsData: WalletData[],
  password: string,
  roles: ('master' | 'dev' | 'sniper' | 'normal')[],
): Promise<{ wallet: WalletData; keypair: Keypair }[]> {
  const filteredWallets = walletsData.filter((w) => roles.includes(w.role))
  const keypairs = await getKeypairs(filteredWallets, password)

  return filteredWallets.map((wallet, index) => ({
    wallet,
    keypair: keypairs[index],
  }))
}

/**
 * Create multiple wallets at once
 */
export async function createWalletBatch(
  password: string,
  count: number,
  roles: ('master' | 'dev' | 'sniper' | 'normal')[],
): Promise<WalletData[]> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  if (count > 20) {
    throw new Error('Cannot create more than 20 wallets at once')
  }

  const wallets: WalletData[] = []

  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length]
    const wallet = await createWallet(password, role)
    wallets.push(wallet)
  }

  return wallets
}

/**
 * Export wallet group to encrypted .keymaker file
 */
export async function exportWalletGroup(
  groupName: string,
  wallets: WalletData[],
  exportPassword: string,
): Promise<string> {
  try {
    // Create wallet group data structure
    const groupData = {
      version: '1.0',
      name: groupName,
      wallets: wallets.map((wallet) => ({
        publicKey: wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        role: wallet.role,
      })),
      exportedAt: new Date().toISOString(),
      walletsCount: wallets.length,
    }

    // Import the crypto module dynamically to avoid build issues
    const { encryptAES256 } = await import('@/utils/crypto')

    // Encrypt the entire group data
    const jsonData = JSON.stringify(groupData)
    const encrypted = encryptAES256(jsonData, exportPassword)

    // Create .keymaker file format
    const fileData = {
      format: 'keymaker',
      version: '1.0',
      encrypted: encrypted,
      metadata: {
        groupName: groupName,
        walletsCount: wallets.length,
        exportedAt: groupData.exportedAt,
      },
    }

    return JSON.stringify(fileData)
  } catch (error) {
    throw new Error(
      `Failed to export wallet group: ${(error as Error).message}`,
    )
  }
}

/**
 * Import wallet group from encrypted .keymaker file
 */
export async function importWalletGroup(
  fileContent: string,
  importPassword: string,
): Promise<{
  name: string
  wallets: WalletData[]
}> {
  try {
    // Parse .keymaker file
    const fileData = JSON.parse(fileContent)

    // Validate file format
    if (fileData.format !== 'keymaker' || !fileData.encrypted) {
      throw new Error('Invalid .keymaker file format')
    }

    // Import the crypto module dynamically
    const { decryptAES256, isValidEncryptedData } = await import(
      '@/utils/crypto'
    )

    // Validate encrypted data
    if (!isValidEncryptedData(fileData.encrypted)) {
      throw new Error('Corrupted encryption data')
    }

    // Decrypt the wallet group data
    const decrypted = decryptAES256(fileData.encrypted, importPassword)
    const groupData = JSON.parse(decrypted)

    // Validate group data structure
    if (
      !groupData.version ||
      !groupData.name ||
      !Array.isArray(groupData.wallets)
    ) {
      throw new Error('Invalid wallet group data')
    }

    // Validate each wallet
    const wallets: WalletData[] = groupData.wallets.map((wallet: any) => {
      if (!wallet.publicKey || !wallet.encryptedPrivateKey || !wallet.role) {
        throw new Error('Invalid wallet data')
      }

      return {
        publicKey: wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        role: wallet.role,
      }
    })

    return {
      name: groupData.name,
      wallets,
    }
  } catch (error) {
    if ((error as Error).message.includes('Invalid password')) {
      throw new Error('Incorrect password')
    }
    throw new Error(
      `Failed to import wallet group: ${(error as Error).message}`,
    )
  }
}

/**
 * Get database connection
 */
async function getDb() {
  const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
  const sqlite3 = (await import('sqlite3')).default
  const { open } = await import('sqlite')
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
}

/**
 * Save wallet to database
 */
export async function saveWalletToDb(
  walletData: WalletData & { network?: string },
): Promise<void> {
  const db = await getDb()

  try {
    await db.run(
      `INSERT OR REPLACE INTO wallets (address, keypair, role, network) 
       VALUES (?, ?, ?, ?)`,
      [
        walletData.publicKey,
        walletData.encryptedPrivateKey,
        walletData.role,
        walletData.network || 'mainnet',
      ],
    )
  } finally {
    await db.close()
  }
}

/**
 * Get wallet from database
 */
export async function getWalletFromDb(
  address: string,
): Promise<WalletData | null> {
  const db = await getDb()

  try {
    const row = await db.get('SELECT * FROM wallets WHERE address = ?', [
      address,
    ])

    if (!row) return null

    return {
      publicKey: row.address,
      encryptedPrivateKey: row.keypair,
      role: row.role,
    }
  } finally {
    await db.close()
  }
}

/**
 * Get all wallets from database
 */
export async function getAllWalletsFromDb(): Promise<WalletData[]> {
  const db = await getDb()

  try {
    const rows = await db.all('SELECT * FROM wallets')

    return rows.map((row) => ({
      publicKey: row.address,
      encryptedPrivateKey: row.keypair,
      role: row.role,
    }))
  } finally {
    await db.close()
  }
}

/**
 * Delete wallet from database
 */
export async function deleteWalletFromDb(address: string): Promise<void> {
  const db = await getDb()

  try {
    await db.run('DELETE FROM wallets WHERE address = ?', [address])
  } finally {
    await db.close()
  }
}
