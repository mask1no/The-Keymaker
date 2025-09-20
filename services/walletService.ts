import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/crypto';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import bs58 from 'bs58';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export type Wallet = {
  id?: number;
  name: string;
  publicKey: string;
  privateKey: string; // encrypted
  group: string;
  color: string;
  isActive: boolean;
};

export async function getWalletByPublicKey(publicKey: string): Promise<Wallet | null> {
  try {
    const dbInstance = await db;
    const row = await dbInstance.get('SELECT * FROM wallets WHERE address = ?', [publicKey]);
    return (row as Wallet) || null;
  } catch (error) {
    logger.error('Failed to get wallet by publicKey', { error });
    Sentry.captureException(error);
    return null;
  }
}

export async function createWallet(password: string): Promise<Wallet> {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const keypair = Keypair.fromSecretKey(seed.slice(0, 32));
  const encryptedPrivateKey = encrypt(bs58.encode(keypair.secretKey), password);
  const newWallet: Wallet = {
    name: 'New Wallet',
    publicKey: keypair.publicKey.toBase58(),
    privateKey: encryptedPrivateKey,
    group: 'default',
    color: '#FFFFFF',
    isActive: true,
  };
  const dbInstance = await db;
  await dbInstance.run(
    'INSERT INTO wallets (address, keypair, role, network, balance) VALUES (?, ?, ?, ?, ?)',
    [newWallet.publicKey, newWallet.privateKey, 'normal', 'mainnet', 0],
  );
  return newWallet;
}

export async function getWallets(password: string): Promise<Wallet[]> {
  const dbInstance = await db;
  const rows = (await dbInstance.all('SELECT * FROM wallets')) as any[];
  const decryptedWallets: Wallet[] = await Promise.all(
    rows.map(async (r) => {
      try {
        const decryptedKey = decrypt(r.keypair, password);
        return {
          name: r.name || 'Wallet',
          publicKey: r.address,
          privateKey: decryptedKey,
          group: r.group || 'default',
          color: r.color || '#FFFFFF',
          isActive: Boolean(r.isActive ?? true),
        };
      } catch (e) {
        return {
          name: r.name || 'Wallet',
          publicKey: r.address,
          privateKey: 'decryption-failed',
          group: r.group || 'default',
          color: r.color || '#FFFFFF',
          isActive: Boolean(r.isActive ?? true),
        };
      }
    }),
  );
  return decryptedWallets;
}

export async function importWallet(privateKey: string, password: string): Promise<Wallet> {
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const encryptedPrivateKey = encrypt(bs58.encode(keypair.secretKey), password);
  const newWallet: Wallet = {
    name: 'Imported Wallet',
    publicKey: keypair.publicKey.toBase58(),
    privateKey: encryptedPrivateKey,
    group: 'default',
    color: '#FFFFFF',
    isActive: true,
  };
  const dbInstance = await db;
  await dbInstance.run(
    'INSERT OR REPLACE INTO wallets (address, keypair, role, network, balance) VALUES (?, ?, ?, ?, ?)',
    [newWallet.publicKey, newWallet.privateKey, 'normal', 'mainnet', 0],
  );
  return newWallet;
}
