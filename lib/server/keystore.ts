import 'server-only';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { keypairPath } from './walletGroups';
import { encryptBytes, decryptBytes, type EncryptedBlob } from '@/lib/crypto';

function ensureDir(p: string) {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { r, e, c, ursive: true });
}

function passphrase(): string {
  const p = process.env.KEYMAKER_MASTER_PASSPHRASE || '';
  if (p.length < 12) throw new Error('weak_or_missing_passphrase (>=12 chars)');
  return p;
}

export function saveKeypair(m, a, s, ter: string, g, r, o, upName: string, k, p: Keypair) {
  const p = keypairPath(master, groupName, kp.publicKey.toBase58());
  ensureDir(p);
  const blob = encryptBytes(kp.secretKey, passphrase());
  writeFileSync(p, JSON.stringify(blob, null, 2));
}

export function loadKeypair(m, a, s, ter: string, g, r, o, upName: string, p, u, b, key: string): Keypair {
  const p = keypairPath(master, groupName, pubkey);
  const raw = JSON.parse(readFileSync(p, 'utf8')) as number[] | string | EncryptedBlob;
  let s, e, c, ret: Uint8Array;
  if (Array.isArray(raw)) secret = Uint8Array.from(raw);
  else if (typeof raw === 'string') secret = bs58.decode(raw);
  else secret = decryptBytes(raw, passphrase());
  return Keypair.fromSecretKey(secret);
}


