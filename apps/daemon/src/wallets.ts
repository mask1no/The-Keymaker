import sodium from "libsodium-wrappers";
import { randomUUID, scryptSync, randomBytes } from "crypto";
import bs58 from "bs58";
import fs from "fs";
import path from "path";
import { db, wallets, folders, tasks } from "./db";
import { execute } from "./db";
import { eq } from "drizzle-orm";
import { Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConn } from "./solana";
import { logger } from "@keymaker/logger";
import { getKeypairForPubkey } from "./secrets";

function requirePassword(): string {
  const pass = process.env.KEYSTORE_PASSWORD;
  if (!pass) throw new Error("KEYSTORE_PASSWORD not set");
  return pass;
}

// Legacy helpers retained for compatibility (unused now)
export async function encryptSecret(_secret: Uint8Array): Promise<string> { return "keystore"; }
export async function decryptSecret(_enc: string): Promise<Uint8Array> { throw new Error("KEYSTORE_LOCKED"); }

// --- Keystore (scrypt + secretbox) ---
type Keystore = {
  version: 1;
  kdf: "scrypt";
  salt: string; // base64
  nonce: string; // base64
  data: string; // base64(ciphertext)
};

let keystoreCache: { wallets: Record<string, { secretBase58: string; createdAt: number; folderId: string; role: string }> } | null = null;
let keystoreSalt: Uint8Array | null = null;
let keystoreNonce: Uint8Array | null = null;
let keystorePath = process.env.KEYSTORE_FILE || path.resolve(__dirname, "../keystore.json");

export async function initKeystore(password: string) {
  await sodium.ready;
  if (!password) throw new Error("KEYSTORE_PASSWORD not set");
  if (!fs.existsSync(path.dirname(keystorePath))) fs.mkdirSync(path.dirname(keystorePath), { recursive: true });
  if (!fs.existsSync(keystorePath)) {
    keystoreSalt = randomBytes(16);
    keystoreNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const key = scryptSync(password, keystoreSalt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
    const plaintext = Buffer.from(JSON.stringify({ wallets: {} }));
    const box = sodium.crypto_secretbox_easy(plaintext, keystoreNonce, key);
    const ks: Keystore = {
      version: 1,
      kdf: "scrypt",
      salt: Buffer.from(keystoreSalt).toString("base64"),
      nonce: Buffer.from(keystoreNonce).toString("base64"),
      data: Buffer.from(box).toString("base64")
    };
    fs.writeFileSync(keystorePath, JSON.stringify(ks, null, 2));
    keystoreCache = { wallets: {} };
    return;
  }
  const raw: Keystore = JSON.parse(fs.readFileSync(keystorePath, "utf8"));
  if (raw.kdf !== "scrypt" || raw.version !== 1) throw new Error("unsupported keystore format");
  keystoreSalt = Buffer.from(raw.salt, "base64");
  keystoreNonce = Buffer.from(raw.nonce, "base64");
  const key = scryptSync(password, keystoreSalt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  const box = Buffer.from(raw.data, "base64");
  const opened = sodium.crypto_secretbox_open_easy(box, keystoreNonce, key);
  if (!opened) throw new Error("KEYSTORE_LOCKED");
  keystoreCache = JSON.parse(Buffer.from(opened).toString("utf8"));
}

// Deprecated (replaced by node:scryptSync) kept for reference
async function scryptKey(_password: string, _salt: Uint8Array) { return Buffer.alloc(32, 0); }

function requireKeystore() {
  if (!keystoreCache || !keystoreSalt) throw new Error("KEYSTORE_LOCKED");
}

function persistKeystore(password: string) {
  if (!keystoreCache || !keystoreSalt) throw new Error("KEYSTORE_LOCKED");
  const key = scryptSync(password, keystoreSalt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintext = Buffer.from(JSON.stringify(keystoreCache));
  const box = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  const ks: Keystore = { version: 1, kdf: "scrypt", salt: Buffer.from(keystoreSalt).toString("base64"), nonce: Buffer.from(nonce).toString("base64"), data: Buffer.from(box).toString("base64") };
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

export async function renameFolder(id: string, name: string) {
  const rows = (await db.select().from(folders).where(eq(folders.id, id))) as any[];
  if (!rows.length) throw new Error("FOLDER_NOT_FOUND");
  await db.update(folders).set({ name }).where(eq(folders.id, id));
}

export async function importWallet(folderId: string, secret: Uint8Array, pubkeyBase58: string) {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  if (rows.length >= 20) throw new Error("WALLET_LIMIT_REACHED");
  const id = randomUUID();
  await db.insert(wallets).values({ id, folder_id: folderId, pubkey: pubkeyBase58, enc_privkey: "keystore", created_at: Date.now() });
  // write to keystore
  requireKeystore();
  if (!keystoreCache) throw new Error("KEYSTORE_LOCKED");
  keystoreCache.wallets[pubkeyBase58] = { secretBase58: bs58.encode(secret), createdAt: Date.now(), folderId, role: "sniper" };
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
  const scaled = amounts.map((a) => a * scale);
  // clamp to floor precision 1e-9 SOL, fix drift on the first entry
  const floored = scaled.map((x) => Math.floor(x * 1e9) / 1e9);
  let drift = totalSol - floored.reduce((a,b)=>a+b, 0);
  if (n > 0) floored[0] = Math.max(minPerWallet, floored[0] + drift);
  return floored;
}

export async function createWalletInFolder(folderId: string): Promise<{ id: string; pubkey: string }> {
  const rows = (await db.select().from(wallets).where(eq(wallets.folder_id, folderId))) as any[];
  if (rows.length >= 20) throw new Error("WALLET_LIMIT_REACHED");
  requireKeystore();
  if (!keystoreCache) throw new Error("KEYSTORE_LOCKED");
  const kp = Keypair.generate();
  const pubkeyBase58 = kp.publicKey.toBase58();
  const id = randomUUID();
  await db.insert(wallets).values({ id, folder_id: folderId, pubkey: pubkeyBase58, enc_privkey: "keystore", created_at: Date.now() });
  keystoreCache.wallets[pubkeyBase58] = { secretBase58: bs58.encode(kp.secretKey), createdAt: Date.now(), folderId, role: "sniper" };
  persistKeystore(process.env.KEYSTORE_PASSWORD!);
  return { id, pubkey: pubkeyBase58 };
}

export async function importWalletToFolder(folderId: string, secretBase58: string): Promise<{ id: string; pubkey: string }> {
  try {
    const secret = bs58.decode(secretBase58);
    const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
    return importWallet(folderId, kp.secretKey, kp.publicKey.toBase58());
  } catch {
    throw new Error("INVALID_SECRET");
  }
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


export async function readSecretFromKeystore(pubkey: string): Promise<string | null> {
  if (!keystoreCache) throw new Error("KEYSTORE_LOCKED");
  const entry = keystoreCache.wallets[pubkey];
  return entry?.secretBase58 ?? null;
}


// --- Folder delete preview & sweep ---
const DUST_LAMPORTS = 5000;
const EST_FEE_LAMPORTS = 5000;

async function getWalletBalanceLamports(pubkey: string): Promise<number> {
  const conn = getConn();
  try {
    return await conn.getBalance(new PublicKey(pubkey), "confirmed");
  } catch {
    throw new Error("RPC_UNAVAILABLE");
  }
}

async function getTokenPortfolio(pubkey: string): Promise<Array<{ mint: string; amount: string }>> {
  const conn = getConn();
  try {
    const owner = new PublicKey(pubkey);
    const r = await conn.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") });
    const out: Array<{ mint: string; amount: string }> = [];
    for (const it of r.value) {
      const info: any = it.account.data.parsed.info;
      const ui = info.tokenAmount?.uiAmountString ?? "0";
      out.push({ mint: info.mint, amount: ui });
    }
    return out;
  } catch {
    return [];
  }
}

export async function getFolderDeletePreview(id: string): Promise<{ id: string; wallets: Array<{ pubkey: string; solLamports: number; tokens: Array<{ mint: string; amount: string }> }>; estFeesLamports: number }> {
  const f = (await db.select().from(folders).where(eq(folders.id, id))) as any[];
  if (!f.length) throw new Error("FOLDER_NOT_FOUND");
  const ws = (await db.select().from(wallets).where(eq(wallets.folder_id, id))) as any[];
  const out: Array<{ pubkey: string; solLamports: number; tokens: Array<{ mint: string; amount: string }> }> = [];
  for (const w of ws) {
    const pubkey = w.pubkey as string;
    const [lamports, tokens] = await Promise.all([
      getWalletBalanceLamports(pubkey),
      getTokenPortfolio(pubkey)
    ]);
    out.push({ pubkey, solLamports: lamports, tokens });
  }
  const estFeesLamports = ws.length * EST_FEE_LAMPORTS;
  return { id, wallets: out, estFeesLamports };
}

const folderSweepLock = new Set<string>();
const sweepProgress = new Map<string, { signatures: string[] }>();

function keypairFromKeystoreOrThrow(pubkey: string): Keypair {
  if (!keystoreCache) throw new Error("KEYSTORE_LOCKED");
  const entry = keystoreCache.wallets[pubkey];
  if (!entry) throw new Error("PAYER_NOT_AVAILABLE");
  return Keypair.fromSecretKey(bs58.decode(entry.secretBase58));
}

export async function sweepAndDeleteFolder(params: { id: string; masterPubkey: string; onProgress?: (ev: { kind: "SWEEP_PROGRESS"; id: string; step: "SENT"|"VERIFY"|"DONE"; info?: { pubkey?: string; sig?: string } }) => void }): Promise<{ signatures: string[] }> {
  const { id, masterPubkey, onProgress } = params;
  if (folderSweepLock.has(id)) {
    // idempotent: return current state
    const cur = sweepProgress.get(id) || { signatures: [] };
    return cur;
  }
  const f = (await db.select().from(folders).where(eq(folders.id, id))) as any[];
  if (!f.length) throw new Error("FOLDER_NOT_FOUND");
  // Busy check: active tasks on this folder
  const active = await execute(`SELECT COUNT(1) as c FROM tasks WHERE folder_id = ? AND state NOT IN ('DONE','FAIL','ABORT')`, [id]) as any[];
  const c = Number((active as any)[0]?.c || 0);
  if (c > 0) throw new Error("FOLDER_BUSY");

  folderSweepLock.add(id);
  try {
    const wsInFolder = (await db.select().from(wallets).where(eq(wallets.folder_id, id))) as any[];
    const conn = getConn();
    const master = new PublicKey(masterPubkey);
    const signatures: string[] = [];
    for (const w of wsInFolder) {
      const fromPubkey = new PublicKey(w.pubkey as string);
      let bal = 0;
      try { bal = await conn.getBalance(fromPubkey, "confirmed"); } catch { throw new Error("RPC_UNAVAILABLE"); }
      const sendable = bal - EST_FEE_LAMPORTS;
      if (sendable <= DUST_LAMPORTS) continue;
      const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey, toPubkey: master, lamports: sendable }));
      const payer = keypairFromKeystoreOrThrow(w.pubkey as string);
      try {
        const sig = await conn.sendTransaction(tx, [payer], { skipPreflight: true, maxRetries: 3 });
        signatures.push(sig);
        onProgress?.({ kind: "SWEEP_PROGRESS", id, step: "SENT", info: { pubkey: w.pubkey as string, sig } });
        logger.info("sweep-sent", { folderId: id, pubkey: w.pubkey as string, sig });
      } catch (e) {
        logger.error("sweep-send-fail", { folderId: id, pubkey: w.pubkey as string, err: (e as Error).message });
        throw new Error("SWEEP_FAILED");
      }
    }

    // Verify balances are low
    for (const w of wsInFolder) {
      const fromPubkey = new PublicKey(w.pubkey as string);
      const bal = await conn.getBalance(fromPubkey, "confirmed");
      if (bal > DUST_LAMPORTS) {
        onProgress?.({ kind: "SWEEP_PROGRESS", id, step: "VERIFY" });
        throw new Error("SWEEP_FAILED");
      }
    }

    // Delete from DB and keystore
    for (const w of wsInFolder) {
      await execute(`DELETE FROM wallets WHERE id = ?`, [w.id]);
      if (keystoreCache) delete keystoreCache.wallets[w.pubkey as string];
    }
    await execute(`DELETE FROM folders WHERE id = ?`, [id]);
    persistKeystore(requirePassword());
    sweepProgress.set(id, { signatures });
    onProgress?.({ kind: "SWEEP_PROGRESS", id, step: "DONE" });
    return { signatures };
  } finally {
    folderSweepLock.delete(id);
  }
}

export async function sweepFolderToMaster(params: { id: string; masterPubkey: string; onProgress?: (ev:{ kind:"SWEEP_PROGRESS"; id:string; step:"SENT"|"VERIFY"|"DONE"; info?:{ pubkey?:string; sig?:string } })=>void }): Promise<{ signatures: string[] }> {
  const { id, masterPubkey, onProgress } = params;
  const wsInFolder = await db.select().from(wallets).where(eq(wallets.folder_id, id)) as any[];
  if (!wsInFolder.length) return { signatures: [] };
  const conn = getConn();
  const master = new PublicKey(masterPubkey);
  const signatures: string[] = [];
  for (const w of wsInFolder) {
    const fromPubkey = new PublicKey(w.pubkey as string);
    let bal = 0;
    try { bal = await conn.getBalance(fromPubkey, "confirmed"); } catch { throw new Error("RPC_UNAVAILABLE"); }
    const sendable = bal - 5000;
    if (sendable <= 5000) continue;
    const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey, toPubkey: master, lamports: sendable }));
    const kp = await getKeypairForPubkey(fromPubkey.toBase58());
    if (!kp) continue;
    const sig = await conn.sendTransaction(tx, [kp], { skipPreflight: true, maxRetries: 3 });
    signatures.push(sig);
    onProgress?.({ kind: "SWEEP_PROGRESS", id, step: "SENT", info: { pubkey: fromPubkey.toBase58(), sig } });
  }
  onProgress?.({ kind: "SWEEP_PROGRESS", id, step: "DONE" });
  return { signatures };
}

