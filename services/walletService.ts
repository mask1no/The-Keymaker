import { Keypair } from '@solana/web3.js';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import crypto from 'crypto';

type WalletRole = 'master' | 'dev' | 'sniper' | 'normal';

function encrypt(text: string, password: string): string {
  const algorithm = 'aes-256-ctr';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string, password: string): string {
  const algorithm = 'aes-256-ctr';
  const key = crypto.scryptSync(password, 'salt', 32);
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

export async function createWallet(password: string, role: WalletRole): Promise<{ publicKey: string; encryptedPrivateKey: string }> {
  if (password.length < 8) throw new Error('Password too short');
  if (!['master', 'dev', 'sniper', 'normal'].includes(role)) throw new Error('Invalid role');
  
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKey = Buffer.from(keypair.secretKey).toString('hex');
  const encryptedPrivateKey = encrypt(privateKey, password);
  
  // Store in database (SQLite)
  const db = new sqlite3.Database('./data/analytics.db');
  const run = promisify(db.run.bind(db));
  
  await run(
    'INSERT INTO wallets (publicKey, encryptedPrivateKey, role) VALUES (?, ?, ?)',
    publicKey, encryptedPrivateKey, role
  );
  
  db.close();
  
  return { publicKey, encryptedPrivateKey };
}

export async function decryptWallet(encryptedPrivateKey: string, password: string): Promise<Keypair> {
  try {
    const privateKeyHex = decrypt(encryptedPrivateKey, password);
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    throw new Error('Invalid password or corrupted key');
  }
}

export async function getWalletsByRole(role: WalletRole): Promise<Array<{ publicKey: string; encryptedPrivateKey: string; role: string }>> {
  const db = new sqlite3.Database('./data/analytics.db');
  const all = promisify(db.all.bind(db));
  
  const wallets = await all(
    'SELECT publicKey, encryptedPrivateKey, role FROM wallets WHERE role = ?',
    role
  ) as Array<{ publicKey: string; encryptedPrivateKey: string; role: string }>;
  
  db.close();
  return wallets;
}

export async function getAllWallets(): Promise<Array<{ publicKey: string; encryptedPrivateKey: string; role: string; balance: number }>> {
  const db = new sqlite3.Database('./data/analytics.db');
  const all = promisify(db.all.bind(db));
  
  const wallets = await all(
    'SELECT publicKey, encryptedPrivateKey, role, balance FROM wallets'
  ) as Array<{ publicKey: string; encryptedPrivateKey: string; role: string; balance: number }>;
  
  db.close();
  return wallets;
}