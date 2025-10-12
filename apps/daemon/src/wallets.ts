import sodium from "libsodium-wrappers";
import { randomUUID } from "crypto";
import bs58 from "bs58";
import fs from "fs";
import path from "path";
import { db, wallets, folders } from "./db";
import { eq } from "drizzle-orm";
import { Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConn } from "./solana";

function requirePassword(): string {
  const pass = process.env.KEYSTORE_PASSWORD;
  if (!pass) throw new Error("KEYSTORE_PASSWORD not set");
  return pass;
}

export async function encryptSecret(secret: Uint8Array): Promise<string> {
  await sodium.ready;
  const pass = requirePassword();
  const salt = sodium.randombytes_buf(16);
  const key = sodium.crypto_pwhash(
    32,
    pass,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const box = sodium.crypto_secretbox_easy(secret, nonce, key);
  return bs58.encode(Buffer.concat([Buffer.from(salt), Buffer.from(nonce), Buffer.from(box)]));
}

export async function decryptSecret(enc: string): Promise<Uint8Array> {
  await sodium.ready;
  const pass = requirePassword();
  const buf = Buffer.from(bs58.decode(enc));
  const salt = buf.subarray(0, 16);
  const nonce = buf.subarray(16, 16 + sodium.crypto_secretbox_NONCEBYTES);
  const box = buf.subarray(16 + sodium.crypto_secretbox_NONCEBYTES);
  const key = sodium.crypto_pwhash(
    32,
    pass,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  const opened = sodium.crypto_secretbox_open_easy(box, nonce, key);
  if (!opened) throw new Error("keystore decrypt failed");
  return opened;
}

// --- Keystore (scrypt + secretbox) ---
type Keystore = {
  version: 1;
  kdf: "scrypt";
  salt: string; // base64
  data: string; // base64(ciphertext)
};

let keystoreCache: { wallets: Record<string, { secret: string; createdAt: number; folderId: string; role: string }> } | null = null;
let keystoreSalt: Uint8Array | null = null;
let keystorePath = process.env.KEYSTORE_FILE || path.resolve("./apps/daemon/keystore.json");

export async function initKeystore(password: string) {
  await sodium.ready;
  if (!password) throw new Error("KEYSTORE_PASSWORD not set");
  if (!fs.existsSync(path.dirname(keystorePath))) fs.mkdirSync(path.dirname(keystorePath), { recursive: true });
  if (!fs.existsSync(keystorePath)) {
    keystoreSalt = sodium.randombytes_buf(16);
    const key = await scryptKey(password, keystoreSalt);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const plaintext = Buffer.from(JSON.stringify({ wallets: {} }));
    const box = sodium.crypto_secretbox_easy(plaintext, nonce, key);
    const data = Buffer.concat([Buffer.from(nonce), Buffer.from(box)]).toString("base64");
    const ks: Keystore = { version: 1, kdf: "scrypt", salt: Buffer.from(keystoreSalt).toString("base64"), data };
    fs.writeFileSync(keystorePath, JSON.stringify(ks, null, 2));
    keystoreCache = { wallets: {} };
    return;
  }
  const raw: Keystore = JSON.parse(fs.readFileSync(keystorePath, "utf8"));
  if (raw.kdf !== "scrypt" || raw.version !== 1) throw new Error("unsupported keystore format");
  keystoreSalt = Buffer.from(raw.salt, "base64");
  const key = await scryptKey(password, keystoreSalt);
  const data = Buffer.from(raw.data, "base64");
  const nonce = data.subarray(0, sodium.crypto_secretbox_NONCEBYTES);
  const box = data.subarray(sodium.crypto_secretbox_NONCEBYTES);
  const opened = sodium.crypto_secretbox_open_easy(box, nonce, key);
  if (!opened) throw new Error("KEYSTORE_LOCKED");
  keystoreCache = JSON.parse(Buffer.from(opened).toString("utf8"));
}

async function scryptKey(password: string, salt: Uint8Array) {
  await sodium.ready;
  return sodium.crypto_pwhash(
    32,
    password,
    salt,
    1 << 15, // N
    8 << 10, // memlimit approx
    sodium.crypto_pwhash_ALG_DEFAULT
  );
}

function requireKeystore() {
  if (!keystoreCache || !keystoreSalt) throw new Error("KEYSTORE_LOCKED");
}

function persistKeystore(password: string) {
  if (!keystoreCache || !keystoreSalt) throw new Error("KEYSTORE_LOCKED");
  const key = sodium.crypto_pwhash(
    32,
    password,
    keystoreSalt,
    1 << 15,
    8 << 10,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintext = Buffer.from(JSON.stringify(keystoreCache));
  const box = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  const data = Buffer.concat([Buffer.from(nonce), Buffer.from(box)]).toString("base64");
  const ks: Keystore = { version: 1, kdf: "scrypt", salt: Buffer.from(keystoreSalt).toString("base64"), data };
  fs.writeFileSync(keystorePath, JSON.stringify(ks, null, 2));
}

export async function createFolderWithId(id: string, name: string) {
  await db.insert(folders).values({ id, name, max_wallets: 20 });
  return { id, name };
}

export async function listFolders(): Promise<Array<{ id: string; name: string; count: number }>> {
  const fs = (await db.select().from(folders)) as any[];
  const out: Array<{ id: string; name: string; count: number }> = [];
  for (const f of fs) {
    const ws = (await db.select().from(wallets).where(eq(wallets.folder_id, f.id))) as any[];
    out.push({ id: f.id, name: f.name, count: ws.length });
  }
  return out;
}

export async function importWallet(folderId: string, secret: Uint8Array, pubkeyBase58: string) {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  if (rows.length >= 20) throw new Error("folder wallet cap reached");
  const id = randomUUID();
  const enc = await encryptSecret(secret);
  await db.insert(wallets).values({ id, folder_id: folderId, pubkey: pubkeyBase58, enc_privkey: enc, created_at: Date.now() });
  // write to keystore
  requireKeystore();
  if (!keystoreCache) throw new Error("KEYSTORE_LOCKED");
  keystoreCache.wallets[pubkeyBase58] = { secret: bs58.encode(secret), createdAt: Date.now(), folderId, role: "sniper" };
  persistKeystore(process.env.KEYSTORE_PASSWORD!);
  return { id, pubkey: pubkeyBase58 };
}

export async function listWallets(folderId: string) {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  return rows.map(r => ({ id: r.id, pubkey: r.pubkey, role: r.role ?? "sniper" }));
}

export function randomizedFundingSplits(totalSol: number, n: number, minPerWallet = 0) {
  if (n <= 0) return [] as number[];
  const draws: number[] = [];
  for (let i = 0; i < n; i++) {
    // abs(N(1, 0.35)) via Box-Muller
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    draws.push(Math.abs(1 + 0.35 * z));
  }
  const sum = draws.reduce((a, b) => a + b, 0);
  const weights = draws.map((d) => d / sum);
  const amounts = weights.map((w) => Math.max(minPerWallet, w * totalSol));
  const scale = totalSol / amounts.reduce((a, b) => a + b, 0);
  return amounts.map((a) => a * scale);
}

export async function createWalletInFolder(folderId: string): Promise<{ id: string; pubkey: string }> {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  if (rows.length >= 20) throw new Error("WALLET_LIMIT_REACHED");
  requireKeystore();
  if (!keystoreCache) throw new Error("KEYSTORE_LOCKED");
  const kp = Keypair.generate();
  const pubkeyBase58 = kp.publicKey.toBase58();
  const id = randomUUID();
  const enc = await encryptSecret(kp.secretKey);
  await db.insert(wallets).values({ id, folder_id: folderId, pubkey: pubkeyBase58, enc_privkey: enc, created_at: Date.now() });
  keystoreCache.wallets[pubkeyBase58] = { secret: bs58.encode(kp.secretKey), createdAt: Date.now(), folderId, role: "sniper" };
  persistKeystore(process.env.KEYSTORE_PASSWORD!);
  return { id, pubkey: pubkeyBase58 };
}

export async function importWalletToFolder(folderId: string, secretBase58: string): Promise<{ id: string; pubkey: string }> {
  const secret = bs58.decode(secretBase58);
  const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
  return importWallet(folderId, kp.secretKey, kp.publicKey.toBase58());
}

export async function fundFolderFromMaster(params: { folderId: string; totalSol: number; masterPubkey: string }): Promise<string[]> {
  const { folderId, totalSol, masterPubkey } = params;
  const ws = await listWallets(folderId);
  if (ws.length === 0) return [];
  const conn = getConn();
  const splits = randomizedFundingSplits(totalSol, ws.length, 0.002);
  const masterSecret = process.env.MASTER_SECRET_BASE58;
  if (!masterSecret) throw new Error("MASTER_SIGNER_UNAVAILABLE");
  const master = Keypair.fromSecretKey(bs58.decode(masterSecret));
  if (master.publicKey.toBase58() !== masterPubkey) throw new Error("AUTH_PUBKEY_MISMATCH");
  const sigs: string[] = [];
  for (let i = 0; i < ws.length; i++) {
    const dest = new PublicKey(ws[i].pubkey);
    const lamports = Math.floor(splits[i] * LAMPORTS_PER_SOL);
    if (lamports <= 0) continue;
    const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: master.publicKey, toPubkey: dest, lamports }));
    const sig = await conn.sendTransaction(tx, [master]);
    sigs.push(sig);
  }
  return sigs;
}


