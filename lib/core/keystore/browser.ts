// Minimal browser keystore: Argon2id + AES-GCM; stores ciphertext in IndexedDB
import argon2 from 'argon2-browser';

const DB_NAME = 'keymaker_keystore';
const STORE = 'wallets';

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function aesEncrypt(plain: Uint8Array, key: CryptoKey): Promise<{ iv: string; ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return { iv: btoa(String.fromCharCode(...iv)), ct: btoa(String.fromCharCode(...new Uint8Array(ct))) };
}

async function aesDecrypt(ivB64: string, ctB64: string, key: CryptoKey): Promise<Uint8Array> {
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new Uint8Array(pt);
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const res = await argon2.hash({
    pass: passphrase,
    salt,
    type: argon2.ArgonType.Argon2id,
    time: 3,
    mem: 64 * 1024,
    hashLen: 32,
    parallelism: 1,
    distPath: undefined,
    raw: true,
  });
  const bytes = new Uint8Array(res.hash as ArrayBuffer);
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(secretKey: Uint8Array, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const { iv, ct } = await aesEncrypt(secretKey, key);
  const blob = { v: 1, kdf: 'argon2id', salt: btoa(String.fromCharCode(...salt)), iv, ct };
  return btoa(JSON.stringify(blob));
}

export async function decryptSecret(blobB64: string, passphrase: string): Promise<Uint8Array> {
  const raw = JSON.parse(atob(blobB64));
  if (raw.v !== 1 || raw.kdf !== 'argon2id') throw new Error('unsupported_blob');
  const salt = Uint8Array.from(atob(raw.salt), (c) => c.charCodeAt(0));
  const key = await deriveKey(passphrase, salt);
  return aesDecrypt(raw.iv, raw.ct, key);
}

export async function saveWallet(pubkey: string, blobB64: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(blobB64, pubkey);
  });
}

export async function loadWallet(pubkey: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE).get(pubkey);
    req.onsuccess = () => resolve((req.result as string) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function listPubkeys(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as string[]) || []);
    req.onerror = () => reject(req.error);
  });
}


