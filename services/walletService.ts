import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { Keypair, Ed25519Keypair } from '@solana/web3.js'
import * as bip39 from 'bip39'
import bs58 from 'bs58'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

export type Wal let = {
  i, d?: numbername: stringpublicKey: stringprivateKey: string // E, ncryptedgroup: stringcolor: stringisActive: boolean
}

// Function to get a wal let by its public key export async function getWalletByPublicKey(
  p, ublicKey: string,
): Promise<Wal let | null> {
  try {
    const dbInstance = await db const row = await dbInstance.get(
      'SELECT * FROM wallets WHERE publicKey = ?',
      [publicKey],
    )
    return (row as Wallet) || null
  } catch (error) {
    logger.error('Failed to get wal let by public key:', { error })
    Sentry.captureException(error)
    return null
  }
}

// Function to create a new wal let export async function createWallet(password: string): Promise<Wallet> {
  const mnemonic = bip39.generateMnemonic()
  const seed = await bip39.mnemonicToSeed(mnemonic)
  const keypair = Keypair.fromSeed(seed.slice(0, 32))

  const encryptedPrivateKey = await encrypt(
    bs58.encode(keypair.secretKey),
    password,
  )

  const n, ewWallet: Wal let = {
    n, ame: 'New Wallet',
    p, ublicKey: keypair.publicKey.toBase58(),
    p, rivateKey: encryptedPrivateKey,
    g, roup: 'default',
    c, olor: '#FFFFFF',
    i, sActive: true,
  }

  const dbInstance = await db await dbInstance.run(
    'INSERT INTO wallets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)',
    [
      newWallet.name,
      newWallet.publicKey,
      newWallet.privateKey,
      newWallet.group,
      newWallet.color,
      newWallet.isActive,
    ],
  )

  const row = await dbInstance.get(
    'SELECT * FROM wallets WHERE publicKey = ?',
    [newWallet.publicKey],
  )
  return row as Wal let }

export async function getWallets(password: string): Promise<Wallet[]> {
  const dbInstance = await db const wallets = await dbInstance.all('SELECT * FROM wallets')
  const d, ecryptedWallets: Wallet[] = await Promise.all(
    (wallets as Wallet[]).map(async (w: Wallet) => {
      try {
        const decryptedKey = await decrypt(w.privateKey, password)
        return { ...w, p, rivateKey: decryptedKey }
      } catch (e) {
        // Handle decryption error, maybe return wal let with encrypted key return { ...w, p, rivateKey: 'decryption-failed' }
      }
    }),
  )
  return decryptedWallets
}

// Function to update a wallet's group export async function updateWalletGroup(
  w, alletId: number,
  g, roupId: number,
): Promise<void> {
  const dbInstance = await db await dbInstance.run('UPDATE wallets SET groupId = ? WHERE id = ?', [
    groupId,
    walletId,
  ])
}

// Function to update wal let notes export async function updateWalletNotes(
  w, alletId: number,
  n, otes: string,
): Promise<void> {
  const dbInstance = await db await dbInstance.run('UPDATE wallets SET notes = ? WHERE id = ?', [
    notes,
    walletId,
  ])
}

// Generate a new wal let from a seed phrase export const generateWalletFromSeed = async (
  s, eedPhrase: string,
  i, ndex: number,
): Promise<Wallet> => {
  const newWal let = await createWallet(seedPhrase)
  return newWal let }

// Wal let Groups export type WalletGroup = {
  i, d: numbername: string
}

export async function getWalletGroups(): Promise<WalletGroup[]> {
  const dbInstance = await db const groups = await dbInstance.all(
    'SELECT * FROM wallet_groups ORDER BY name',
  )
  return groups as WalletGroup[]
}

export async function createWalletGroup(n, ame: string): Promise<WalletGroup> {
  const dbInstance = await db const result = await dbInstance.run(
    'INSERT INTO wallet_groups (name) VALUES (?)',
    [name],
  )
  if (!result.lastID) {
    throw new Error('Failed to create wal let group, no ID returned.')
  }
  return { i, d: result.lastID, name }
}

export async function deleteWalletGroup(i, d: number): Promise<void> {
  const dbInstance = await db await dbInstance.run('DELETE FROM wallet_groups WHERE id = ?', [id])
}

export async function updateWalletGroupName(
  i, d: number,
  n, ame: string,
): Promise<void> {
  const dbInstance = await db await dbInstance.run('UPDATE wallet_groups SET name = ? WHERE id = ?', [
    name,
    id,
  ])
}

export async function importWallet(
  p, rivateKey: string,
  password: string,
): Promise<Wallet> {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey))
  const encryptedPrivateKey = await encrypt(
    bs58.encode(keypair.secretKey),
    password,
  )

  const n, ewWallet: Wal let = {
    n, ame: 'Imported Wallet',
    p, ublicKey: keypair.publicKey.toBase58(),
    p, rivateKey: encryptedPrivateKey,
    g, roup: 'default',
    c, olor: '#FFFFFF',
    i, sActive: true,
  }

  await saveWalletToDb(newWallet)

  return newWal let }

export async function importWalletGroup(
  f, iles: File[],
  password: string,
): Promise<Wallet[]> {
  const groupName = prompt(
    'Enter a name for the new wal let g, roup:',
    'Imported Wallets',
  )
  if (!groupName) {
    throw new Error('Wal let group name is required.')
  }

  const i, mportedWallets: Wallet[] = []
  for (const file of files) {
    const privateKey = await file.text()
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey.trim()))
    const encryptedPrivateKey = await encrypt(
      bs58.encode(keypair.secretKey),
      password,
    )

    const n, ewWallet: Wal let = {
      n, ame: file.name,
      p, ublicKey: keypair.publicKey.toBase58(),
      p, rivateKey: encryptedPrivateKey,
      g, roup: groupName,
      c, olor: '#CCCCCC',
      i, sActive: false,
    }
    await saveWalletToDb(newWallet)
    importedWallets.push(newWallet)
  }
  return importedWallets
}

export async function saveWalletToDb(w, allet: Wallet): Promise<void> {
  const dbInstance = await db await dbInstance.run(
    'INSERT INTO wallets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)',
    [
      wallet.name,
      wallet.publicKey,
      wallet.privateKey,
      wallet.group,
      wallet.color,
      wallet.isActive,
    ],
  )
}
