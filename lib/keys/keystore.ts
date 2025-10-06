import 'server-only';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { encryptBytes, decryptBytes, type EncryptedBlob } from '@/lib/crypto';

type KeystoreEntry = {
  label?: string;
  pubkey: string; // base58
  secret: EncryptedBlob; // encrypted secretKey bytes
  createdAt: number;
  updatedAt: number;
};

type KeystoreData = {
  version: 1;
  entries: Record<string, KeystoreEntry>; // key by pubkey
};

const DATA_DIR = process.env.KEYMAKER_DATA_DIR || join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'keystore.json');

let UNLOCKED_KEY: string | null = null; // in-memory passphrase only

function ensureStorage(): void {
  const dir = dirname(FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(FILE)) {
    const fresh: KeystoreData = { version: 1, entries: {} };
    writeFileSync(FILE, JSON.stringify(fresh, null, 2));
  }
}

function readStore(): KeystoreData {
  ensureStorage();
  try {
    const raw = readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { version: 1, entries: parsed.entries || {} } as KeystoreData;
  } catch {
    return { version: 1, entries: {} };
  }
}

function writeStore(s: KeystoreData): void {
  ensureStorage();
  writeFileSync(FILE, JSON.stringify(s, null, 2));
}

function requireUnlocked(): string {
  const p = UNLOCKED_KEY || '';
  if (!p || p.length < 12) throw new Error('keystore_locked');
  return p;
}

export function unlock(passphrase: string): boolean {
  if ((passphrase || '').length < 12) throw new Error('weak_or_missing_passphrase');
  UNLOCKED_KEY = passphrase;
  return true;
}

export function lock(): void {
  UNLOCKED_KEY = null;
}

export function listWallets(): Array<{ pubkey: string; label?: string }> {
  const s = readStore();
  return Object.values(s.entries).map(({ pubkey, label }) => ({ pubkey, label }));
}

export function createWallet(label?: string): { pubkey: string } {
  const pass = requireUnlocked();
  const s = readStore();
  const kp = Keypair.generate();
  const now = Date.now();
  const entry: KeystoreEntry = {
    label: (label || '').trim() || undefined,
    pubkey: kp.publicKey.toBase58(),
    secret: encryptBytes(kp.secretKey, pass),
    createdAt: now,
    updatedAt: now,
  };
  s.entries[entry.pubkey] = entry;
  writeStore(s);
  return { pubkey: entry.pubkey };
}

export function importWallet(pkOrMnemonic: string, label?: string): { pubkey: string } {
  const pass = requireUnlocked();
  const input = pkOrMnemonic.trim();
  let kp: Keypair;
  try {
    if (input.startsWith('[')) {
      const arr = JSON.parse(input) as number[];
      kp = Keypair.fromSecretKey(Uint8Array.from(arr));
    } else if (input.split(' ').length >= 12) {
      throw new Error('mnemonic_unsupported');
    } else {
      kp = Keypair.fromSecretKey(bs58.decode(input));
    }
  } catch (e) {
    throw new Error('invalid_secret');
  }
  const s = readStore();
  const now = Date.now();
  const entry: KeystoreEntry = {
    label: (label || '').trim() || undefined,
    pubkey: kp.publicKey.toBase58(),
    secret: encryptBytes(kp.secretKey, pass),
    createdAt: now,
    updatedAt: now,
  };
  s.entries[entry.pubkey] = entry;
  writeStore(s);
  return { pubkey: entry.pubkey };
}

export function getKeypair(pubkey: string): Keypair {
  const pass = requireUnlocked();
  const s = readStore();
  const e = s.entries[pubkey];
  if (!e) throw new Error('not_found');
  const secret = decryptBytes(e.secret, pass);
  return Keypair.fromSecretKey(secret);
}

export function exportWallet(pubkey: string): { pubkey: string; secretKey: string } {
  const pass = requireUnlocked();
  const s = readStore();
  const e = s.entries[pubkey];
  if (!e) throw new Error('not_found');
  const secret = decryptBytes(e.secret, pass);
  return { pubkey, secretKey: bs58.encode(Buffer.from(secret)) };
}
