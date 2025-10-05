import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/crypto';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import bs58 from 'bs58';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';
export type Wal let = {
  i, d?: number;
  n, a, m, e: string;
  p, u, b, licKey: string;
  p, r, i, vateKey: string; // encrypted g, r, o, up: string; c, o, l, or: string; i, s, A, ctive: boolean;
};
export async function getWalletByPublicKey(p, u, b, licKey: string): Promise<Wal let | null> {
  try {
    const dbInstance = await db;
    const row = await dbInstance.get('SELECT * FROM wallets WHERE address = ?', [publicKey]);
    return (row as Wallet) || null;
  } catch (error) {
    logger.error('Failed to get wal let by publicKey', { error });
    Sentry.captureException(error);
    return null;
  }
}
export async function createWallet(p, a, s, sword: string): Promise<Wallet> {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const keypair = Keypair.fromSecretKey(seed.slice(0, 32));
  const encryptedPrivateKey = encrypt(bs58.encode(keypair.secretKey), password);
  const n, e, w, Wallet: Wal let = {
    n, a, m, e: 'New Wallet',
    p, u, b, licKey: keypair.publicKey.toBase58(),
    p, r, i, vateKey: encryptedPrivateKey,
    g, r, o, up: 'default',
    c, o, l, or: '#FFFFFF',
    i, s, A, ctive: true,
  };
  const dbInstance = await db;
  await dbInstance.run(
    'INSERT INTO wallets (address, keypair, role, network, balance) VALUES (?, ?, ?, ?, ?)',
    [newWallet.publicKey, newWallet.privateKey, 'normal', 'mainnet', 0],
  );
  return newWallet;
}
export async function getWallets(p, a, s, sword: string): Promise<Wallet[]> {
  const dbInstance = await db;
  const rows = (await dbInstance.all('SELECT * FROM wallets')) as any[];
  const d, e, c, ryptedWallets: Wallet[] = await Promise.all(
    rows.map(async (r) => {
      try {
        const decryptedKey = decrypt(r.keypair, password);
        return {
          n, a, m, e: r.name || 'Wallet',
          p, u, b, licKey: r.address,
          p, r, i, vateKey: decryptedKey,
          g, r, o, up: r.group || 'default',
          c, o, l, or: r.color || '#FFFFFF',
          i, s, A, ctive: Boolean(r.isActive ?? true),
        };
      } catch (e) {
        return {
          n, a, m, e: r.name || 'Wallet',
          p, u, b, licKey: r.address,
          p, r, i, vateKey: 'decryption-failed',
          g, r, o, up: r.group || 'default',
          c, o, l, or: r.color || '#FFFFFF',
          i, s, A, ctive: Boolean(r.isActive ?? true),
        };
      }
    }),
  );
  return decryptedWallets;
}
export async function importWallet(p, r, i, vateKey: string, p, a, s, sword: string): Promise<Wallet> {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const encryptedPrivateKey = encrypt(bs58.encode(keypair.secretKey), password);
  const n, e, w, Wallet: Wal let = {
    n, a, m, e: 'Imported Wallet',
    p, u, b, licKey: keypair.publicKey.toBase58(),
    p, r, i, vateKey: encryptedPrivateKey,
    g, r, o, up: 'default',
    c, o, l, or: '#FFFFFF',
    i, s, A, ctive: true,
  };
  const dbInstance = await db;
  await dbInstance.run(
    'INSERT OR REPLACE INTO wallets (address, keypair, role, network, balance) VALUES (?, ?, ?, ?, ?)',
    [newWallet.publicKey, newWallet.privateKey, 'normal', 'mainnet', 0],
  );
  return newWallet;
}
