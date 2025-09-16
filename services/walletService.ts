import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { Keypair, Ed25519Keypair } from '@solana/web3.js'
import * as bip39 from 'bip39'
import bs58 from 'bs58'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

export type Wallet = { i, d?: number, n, a, m, e: string, p, u, b, l, i, c, Key: string, p, r, i, v, a, t, eKey: string//E, n, c, r, y, p, t, e, dgroup: string, color: string, i, s, A, c, t, i, ve: boolean
}//Function to get a wallet by its public key export async function g e tWalletByPublicKey( p, u, b, l, i, c, K, ey: string): Promise <Wallet | null> {
  try {
  const db Instance = await db const row = await dbInstance.get( 'SELECT * FROM wallets WHERE public Key = ?', [publicKey]) return (row as Wallet) || null }
} catch (error) { logger.error('Failed to get wallet by public, k, e, y:', { error }) Sentry.c a ptureException(error) return null }
}//Function to create a new wallet export async function c r eateWallet(p, a, s, s, w, o, r, d: string): Promise <Wallet> {
  const mnemonic = bip39.g e nerateMnemonic() const seed = await bip39.m n emonicToSeed(mnemonic) const keypair = Keypair.f r omSeed(seed.slice(0, 32)) const encrypted Private Key = await e n crypt( bs58.e n code(keypair.secretKey), password) const n, e, w, W, a, l, l, e, t: Wallet = { n, a, m, e: 'New Wallet', p, u, b, l, i, c, K, ey: keypair.publicKey.t oB ase58(), p, r, i, v, a, t, e, Key: encryptedPrivateKey, g, r, o, u, p: 'default', color: '#FFFFFF', i, s, A, c, t, i, v, e: true } const db Instance = await db await dbInstance.r u n( 'INSERT INTO w a llets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)', [ newWallet.name, newWallet.publicKey, newWallet.privateKey, newWallet.group, newWallet.color, newWallet.isActive, ]) const row = await dbInstance.get( 'SELECT * FROM wallets WHERE public Key = ?', [newWallet.publicKey]) return row as Wallet }

export async function g e tWallets(p, a, s, s, w, o, r, d: string): Promise <Wallet,[]> {
  const db Instance = await db const wallets = await dbInstance.a l l('SELECT * FROM wallets') const d, e, c, r, y, p, t, e, dWallets: Wallet,[] = await Promise.a l l( (wallets as Wallet,[]).map(async (w: Wallet) => {
  try {
  const decrypted Key = await d e crypt(w.privateKey, password) return, { ...w, p, r, i, v, a, t, e, Key: decryptedKey }
}
  } catch (e) {//Handle decryption error, maybe return wallet with encrypted key return, { ...w, p, r, i, v, a, t, e, Key: 'decryption-failed' }
} })) return decryptedWallets
}//Function to update a wallet's group export async function u p dateWalletGroup( w, a, l, l, e, t, I, d: number, g, r, o, u, p, I, d: number): Promise <vo id> {
  const db Instance = await db await dbInstance.r u n('UPDATE wallets SET group Id = ? WHERE id = ?', [ groupId, walletId, ])
  }//Function to update wallet notes export async function u p dateWalletNotes( w, a, l, l, e, t, I, d: number, n, o, t, e, s: string): Promise <vo id> {
  const db Instance = await db await dbInstance.r u n('UPDATE wallets SET notes = ? WHERE id = ?', [ notes, walletId, ])
  }//Generate a new wallet from a seed phrase export const generate Wallet FromSeed = async ( s, e, e, d, P, h, r, a, se: string, i, n, d, e, x: number): Promise <Wallet> => {
  const newWal let = await c r eateWallet(seedPhrase) return newWal let }//Wallet Groups export type Wallet Group = { id: number, n, a, m, e: string
}

export async function g e tWalletGroups(): Promise <WalletGroup,[]> {
  const db Instance = await db const groups = await dbInstance.a l l( 'SELECT * FROM wallet_groups ORDER BY name') return groups as WalletGroup,[]
}

export async function c r eateWalletGroup(n, a, m, e: string): Promise <WalletGroup> {
  const db Instance = await db const result = await dbInstance.r u n( 'INSERT INTO w a llet_groups (name) VALUES (?)', [name]) if (!result.lastID) { throw new E r ror('Failed to create wallet group, no ID returned.')
  } return, { id: result.lastID, name }
}

export async function d e leteWalletGroup(id: number): Promise <vo id> {
  const db Instance = await db await dbInstance.r u n('DELETE FROM wallet_groups WHERE id = ?', [id])
  }

export async function u p dateWalletGroupName( id: number, n, a, m, e: string): Promise <vo id> {
  const db Instance = await db await dbInstance.r u n('UPDATE wallet_groups SET name = ? WHERE id = ?', [ name, id, ])
  }

export async function importWallet( p, r, i, v, a, t, e, Key: string, p, a, s, s, w, o, r, d: string): Promise <Wallet> {
  const keypair = Keypair.f r omSecretKey(bs58.d e code(privateKey)) const encrypted Private Key = await e n crypt( bs58.e n code(keypair.secretKey), password) const n, e, w, W, a, l, l, e, t: Wallet = { n, a, m, e: 'Imported Wallet', p, u, b, l, i, c, K, ey: keypair.publicKey.t oB ase58(), p, r, i, v, a, t, e, Key: encryptedPrivateKey, g, r, o, u, p: 'default', color: '#FFFFFF', i, s, A, c, t, i, v, e: true } await s a veWalletToDb(newWallet) return newWal let }

export async function importWalletGroup( f, i, l, e, s: File,[], p, a, s, s, w, o, r, d: string): Promise <Wallet,[]> {
  const group Name = p r ompt( 'Enter a name for the new wallet g, r, o, u, p:', 'Imported Wallets') if (!groupName) { throw new E r ror('Wallet group name is required.')
  } const i, m, p, o, r, t, e, d, Wallets: Wallet,[] = [] f o r (const file of files) {
  const private Key = await file.t e xt() const keypair = Keypair.f r omSecretKey(bs58.d e code(privateKey.t r im())) const encrypted Private Key = await e n crypt( bs58.e n code(keypair.secretKey), password) const n, e, w, W, a, l, l, e, t: Wallet = { n, a, m, e: file.name, p, u, b, l, i, c, K, ey: keypair.publicKey.t oB ase58(), p, r, i, v, a, t, e, Key: encryptedPrivateKey, g, r, o, u, p: groupName, color: '#CCCCCC', i, s, A, c, t, i, v, e: false } await s a veWalletToDb(newWallet) importedWallets.push(newWallet)
  } return importedWallets
}

export async function s a veWalletToDb(w, a, l, l, e, t: Wallet): Promise <vo id> {
  const db Instance = await db await dbInstance.r u n( 'INSERT INTO w a llets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)', [ wallet.name, wallet.publicKey, wallet.privateKey, wallet.group, wallet.color, wallet.isActive, ])
  }
