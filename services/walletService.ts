import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { Keypair, Ed25519Keypair } from '@solana/web3.js'
import * as bip39 from 'bip39'
import bs58 from 'bs58'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

export type Wallet = {
  id?: number
  name: string
  publicKey: string
  privateKey: string // Encrypted
  group: string
  color: string
  isActive: boolean
}

// Function to get a wallet by its public key
export async function getWalletByPublicKey(
  publicKey: string,
): Promise<Wallet | null> {
  try {
    const dbInstance = await db;
    const row = await dbInstance.get('SELECT * FROM wallets WHERE publicKey = ?', [
      publicKey,
    ])
    return (row as Wallet) || null
  } catch (error) {
    logger.error('Failed to get wallet by public key:', { error })
    Sentry.captureException(error)
    return null
  }
}

// Function to create a new wallet
export async function createWallet(
  password: string,
): Promise<Wallet> {
  const mnemonic = bip39.generateMnemonic()
  const seed = await bip39.mnemonicToSeed(mnemonic)
  const keypair = Keypair.fromSeed(seed.slice(0, 32))
  
  const encryptedPrivateKey = await encrypt(
    bs58.encode(keypair.secretKey),
      password,
    )

  const newWallet: Wallet = {
    name: 'New Wallet',
    publicKey: keypair.publicKey.toBase58(),
    privateKey: encryptedPrivateKey,
    group: 'default',
    color: '#FFFFFF',
    isActive: true,
  }

  const dbInstance = await db;
  await dbInstance.run(
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
  
  const row = await dbInstance.get('SELECT * FROM wallets WHERE publicKey = ?', [newWallet.publicKey]);
  return row as Wallet;
}


export async function getWallets(password: string): Promise<Wallet[]> {
  const dbInstance = await db;
  const wallets = await dbInstance.all('SELECT * FROM wallets');
  const decryptedWallets: Wallet[] = await Promise.all(
    (wallets as Wallet[]).map(async (w: Wallet) => {
      try {
        const decryptedKey = await decrypt(w.privateKey, password);
        return { ...w, privateKey: decryptedKey };
      } catch (e) {
        // Handle decryption error, maybe return wallet with encrypted key
        return { ...w, privateKey: 'decryption-failed' };
      }
    })
  );
  return decryptedWallets;
}

// Function to update a wallet's group
export async function updateWalletGroup(
  walletId: number,
  groupId: number,
): Promise<void> {
  const dbInstance = await db;
  await dbInstance.run('UPDATE wallets SET groupId = ? WHERE id = ?', [
    groupId,
    walletId,
  ])
}

// Function to update wallet notes
export async function updateWalletNotes(
  walletId: number,
  notes: string,
): Promise<void> {
  const dbInstance = await db;
  await dbInstance.run('UPDATE wallets SET notes = ? WHERE id = ?', [notes, walletId])
}

// Generate a new wallet from a seed phrase
export const generateWalletFromSeed = async (
  seedPhrase: string,
  index: number,
): Promise<Wallet> => {
  const newWallet = await createWallet(seedPhrase)
  return newWallet;
}

// Wallet Groups
export type WalletGroup = {
  id: number
  name: string
}

export async function getWalletGroups(): Promise<WalletGroup[]> {
  const dbInstance = await db;
  const groups = await dbInstance.all('SELECT * FROM wallet_groups ORDER BY name')
  return groups as WalletGroup[]
}

export async function createWalletGroup(name: string): Promise<WalletGroup> {
  const dbInstance = await db;
  const result = await dbInstance.run(
    'INSERT INTO wallet_groups (name) VALUES (?)',
    [name],
  )
  if (!result.lastID) {
    throw new Error('Failed to create wallet group, no ID returned.')
  }
  return { id: result.lastID, name }
}

export async function deleteWalletGroup(id: number): Promise<void> {
  const dbInstance = await db;
  await dbInstance.run('DELETE FROM wallet_groups WHERE id = ?', [id])
}

export async function updateWalletGroupName(
  id: number,
  name: string,
): Promise<void> {
  const dbInstance = await db;
  await dbInstance.run('UPDATE wallet_groups SET name = ? WHERE id = ?', [name, id])
}

export async function importWallet(privateKey: string, password: string): Promise<Wallet> {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const encryptedPrivateKey = await encrypt(bs58.encode(keypair.secretKey), password);

  const newWallet: Wallet = {
    name: 'Imported Wallet',
    publicKey: keypair.publicKey.toBase58(),
    privateKey: encryptedPrivateKey,
    group: 'default',
    color: '#FFFFFF',
    isActive: true,
  };
  
  await saveWalletToDb(newWallet);
  
  return newWallet;
}

export async function importWalletGroup(wallets: { privateKey: string, name: string }[], password: string): Promise<Wallet[]> {
    const importedWallets: Wallet[] = [];
    for (const w of wallets) {
        const keypair = Keypair.fromSecretKey(bs58.decode(w.privateKey));
        const encryptedPrivateKey = await encrypt(bs58.encode(keypair.secretKey), password);

        const newWallet: Wallet = {
            name: w.name,
            publicKey: keypair.publicKey.toBase58(),
            privateKey: encryptedPrivateKey,
            group: 'imported',
            color: '#CCCCCC',
            isActive: false,
        };
        await saveWalletToDb(newWallet);
        importedWallets.push(newWallet);
    }
    return importedWallets;
}

export async function saveWalletToDb(wallet: Wallet): Promise<void> {
    const dbInstance = await db;
    await dbInstance.run(
        'INSERT INTO wallets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)',
        [
            wallet.name,
            wallet.publicKey,
            wallet.privateKey,
            wallet.group,
            wallet.color,
            wallet.isActive,
        ],
    );
}
