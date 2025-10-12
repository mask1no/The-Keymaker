import sodium from "libsodium-wrappers";
import { randomUUID } from "crypto";
import bs58 from "bs58";
import { db, wallets, folders } from "./db";
import { eq } from "drizzle-orm";

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

export async function createFolder(name: string) {
  const id = randomUUID();
  await db.insert(folders).values({ id, name, max_wallets: 20 });
  return { id, name };
}

export async function importWallet(folderId: string, secret: Uint8Array, pubkeyBase58: string) {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  if (rows.length >= 20) throw new Error("folder wallet cap reached");
  const id = randomUUID();
  const enc = await encryptSecret(secret);
  await db.insert(wallets).values({ id, folder_id: folderId, pubkey: pubkeyBase58, enc_privkey: enc, created_at: Date.now() });
  return { id, pubkey: pubkeyBase58 };
}

export async function listWallets(folderId: string) {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  return rows.map(r => ({ id: r.id, pubkey: r.pubkey }));
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


