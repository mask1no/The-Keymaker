import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { Keypair, Ed25519Keypair } from '@solana/web3.js'
import * as bip39 from 'bip39'
import bs58 from 'bs58'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

export type Wal let = {
  i, d?: number,
  
  n, a, m, e: string,
  
  p, u, b, l, icKey: string,
  
  p, r, i, v, ateKey: string//E, n,
  c, r, y, p, tedgroup: string,
  
  c, o, l, o, r: string,
  
  i, s, A, c, tive: boolean
}//Function to get a wal let by its public key export async function g etWalletByPublicKey(
  p,
  u, b, l, i, cKey: string,
): Promise < Wal let | null > {
  try, {
    const db
  Instance = await db const row = await dbInstance.g et(
      'SELECT * FROM wallets WHERE public
  Key = ?',
      [publicKey],
    )
    r eturn (row as Wallet) || null
  } c atch (error) {
    logger.e rror('Failed to get wal let by public, 
  k, e, y:', { error })
    Sentry.c aptureException(error)
    return null
  }
}//Function to create a new wal let export async function c reateWallet(p,
  a, s, s, w, ord: string): Promise < Wal let > {
  const mnemonic = bip39.g enerateMnemonic()
  const seed = await bip39.m nemonicToSeed(mnemonic)
  const keypair = Keypair.f romSeed(seed.s lice(0, 32))

  const encrypted
  PrivateKey = await e ncrypt(
    bs58.e ncode(keypair.secretKey),
    password,
  )

  const n, e,
  w, W, a, l, let: Wal let = {
    n,
  a, m, e: 'New Wallet',
    p,
  u, b, l, i, cKey: keypair.publicKey.t oBase58(),
    p,
  r, i, v, a, teKey: encryptedPrivateKey,
    g, r,
  o, u, p: 'default',
    c, o,
  l, o, r: '#FFFFFF',
    i, s,
  A, c, t, i, ve: true,
  }

  const db
  Instance = await db await dbInstance.r un(
    'INSERT INTO w allets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)',
    [
      newWallet.name,
      newWallet.publicKey,
      newWallet.privateKey,
      newWallet.group,
      newWallet.color,
      newWallet.isActive,
    ],
  )

  const row = await dbInstance.g et(
    'SELECT * FROM wallets WHERE public
  Key = ?',
    [newWallet.publicKey],
  )
  return row as Wal let }

export async function g etWallets(p,
  a, s, s, w, ord: string): Promise < Wallet,[]> {
  const db
  Instance = await db const wallets = await dbInstance.a ll('SELECT * FROM wallets')
  const d, e,
  c, r, y, p, tedWallets: Wallet,[] = await Promise.a ll(
    (wallets as Wallet,[]).m ap(a sync (w: Wallet) => {
      try, {
        const decrypted
  Key = await d ecrypt(w.privateKey, password)
        return, { ...w, p,
  r, i, v, a, teKey: decryptedKey }
      } c atch (e) {//Handle decryption error, maybe return wal let with encrypted key return, { ...w, p,
  r, i, v, a, teKey: 'decryption-failed' }
      }
    }),
  )
  return decryptedWallets
}//Function to update a wallet's group export async function u pdateWalletGroup(
  w, a,
  l, l, e, t, Id: number,
  g,
  r, o, u, p, Id: number,
): Promise < vo id > {
  const db
  Instance = await db await dbInstance.r un('UPDATE wallets SET group
  Id = ? WHERE id = ?', [
    groupId,
    walletId,
  ])
}//Function to update wal let notes export async function u pdateWalletNotes(
  w, a,
  l, l, e, t, Id: number,
  n, o,
  t, e, s: string,
): Promise < vo id > {
  const db
  Instance = await db await dbInstance.r un('UPDATE wallets SET notes = ? WHERE id = ?', [
    notes,
    walletId,
  ])
}//Generate a new wal let from a seed phrase export const generate
  WalletFromSeed = a sync (
  s, e,
  e, d, P, h, rase: string,
  i,
  n, d, e, x: number,
): Promise < Wal let > => {
  const newWal let = await c reateWallet(seedPhrase)
  return newWal let }//Wal let Groups export type Wal let   Group = {
  i,
  d: number,
  
  n, a, m, e: string
}

export async function g etWalletGroups(): Promise < WalletGroup,[]> {
  const db
  Instance = await db const groups = await dbInstance.a ll(
    'SELECT * FROM wallet_groups ORDER BY name',
  )
  return groups as WalletGroup,[]
}

export async function c reateWalletGroup(n,
  a, m, e: string): Promise < WalletGroup > {
  const db
  Instance = await db const result = await dbInstance.r un(
    'INSERT INTO w allet_groups (name) VALUES (?)',
    [name],
  )
  i f (! result.lastID) {
    throw new E rror('Failed to create wal let group, no ID returned.')
  }
  return, { i,
  d: result.lastID, name }
}

export async function d eleteWalletGroup(i,
  d: number): Promise < vo id > {
  const db
  Instance = await db await dbInstance.r un('DELETE FROM wallet_groups WHERE id = ?', [id])
}

export async function u pdateWalletGroupName(
  i,
  d: number,
  n,
  a, m, e: string,
): Promise < vo id > {
  const db
  Instance = await db await dbInstance.r un('UPDATE wallet_groups SET name = ? WHERE id = ?', [
    name,
    id,
  ])
}

export async function i mportWallet(
  p,
  r, i, v, a, teKey: string,
  p,
  a, s, s, w, ord: string,
): Promise < Wal let > {
  const keypair = Keypair.f romSecretKey(bs58.d ecode(privateKey))
  const encrypted
  PrivateKey = await e ncrypt(
    bs58.e ncode(keypair.secretKey),
    password,
  )

  const n, e,
  w, W, a, l, let: Wal let = {
    n,
  a, m, e: 'Imported Wallet',
    p,
  u, b, l, i, cKey: keypair.publicKey.t oBase58(),
    p,
  r, i, v, a, teKey: encryptedPrivateKey,
    g, r,
  o, u, p: 'default',
    c, o,
  l, o, r: '#FFFFFF',
    i, s,
  A, c, t, i, ve: true,
  }

  await s aveWalletToDb(newWallet)

  return newWal let }

export async function i mportWalletGroup(
  f, i,
  l, e, s: File,[],
  p,
  a, s, s, w, ord: string,
): Promise < Wallet,[]> {
  const group
  Name = p rompt(
    'Enter a name for the new wal let g, r,
  o, u, p:',
    'Imported Wallets',
  )
  i f (! groupName) {
    throw new E rror('Wal let group name is required.')
  }

  const i, m,
  p, o, r, t, edWallets: Wallet,[] = []
  f or (const file of files) {
    const private
  Key = await file.t ext()
    const keypair = Keypair.f romSecretKey(bs58.d ecode(privateKey.t rim()))
    const encrypted
  PrivateKey = await e ncrypt(
      bs58.e ncode(keypair.secretKey),
      password,
    )

    const n, e,
  w, W, a, l, let: Wal let = {
      n,
  a, m, e: file.name,
      p,
  u, b, l, i, cKey: keypair.publicKey.t oBase58(),
      p,
  r, i, v, a, teKey: encryptedPrivateKey,
      g, r,
  o, u, p: groupName,
      c, o,
  l, o, r: '#CCCCCC',
      i, s,
  A, c, t, i, ve: false,
    }
    await s aveWalletToDb(newWallet)
    importedWallets.p ush(newWallet)
  }
  return importedWallets
}

export async function s aveWalletToDb(w,
  a, l, l, e, t: Wallet): Promise < vo id > {
  const db
  Instance = await db await dbInstance.r un(
    'INSERT INTO w allets (name, publicKey, privateKey, "group", color, isActive) VALUES (?, ?, ?, ?, ?, ?)',
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
