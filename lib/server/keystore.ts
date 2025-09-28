import { Keypair, PublicKey } from '@solana/web3.js';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_DIR = join(process.cwd(), 'keypairs');

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function groupDir(name: string): string {
  const p = join(BASE_DIR, name);
  ensureDir(p);
  return p;
}

function nextIndex(dir: string): number {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const idxs = files
    .map((f) => parseInt(f.replace(/\.json$/i, ''), 10))
    .filter((n) => Number.isFinite(n));
  return idxs.length ? Math.max(...idxs) + 1 : 0;
}

export function createGroup(name: string, n: number): string[] {
  const dir = groupDir(name);
  let start = nextIndex(dir);
  const pubs: string[] = [];
  for (let i = 0; i < n; i++) {
    const kp = Keypair.generate();
    const file = join(dir, `${start++}.json`);
    writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)));
    pubs.push(kp.publicKey.toBase58());
  }
  return pubs;
}

export function listGroup(name: string): string[] {
  const dir = groupDir(name);
  const out: string[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      const raw = readFileSync(join(dir, f), 'utf8');
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      out.push(kp.publicKey.toBase58());
    } catch {
      // ignore corrupt file
    }
  }
  return out;
}

export function removeFromGroup(name: string, pubkey: string): boolean {
  const dir = groupDir(name);
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      const raw = readFileSync(join(dir, f), 'utf8');
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      if (kp.publicKey.toBase58() === pubkey) {
        rmSync(join(dir, f));
        return true;
      }
    } catch {
      // skip
    }
  }
  return false;
}

export function loadKeypair(pubkey: string): Keypair {
  const groups = existsSync(BASE_DIR) ? readdirSync(BASE_DIR) : [];
  for (const name of groups) {
    const dir = join(BASE_DIR, name);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      try {
        const raw = readFileSync(join(dir, f), 'utf8');
        const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
        if (kp.publicKey.toBase58() === pubkey) return kp;
      } catch {
        // skip
      }
    }
  }
  throw new Error(`Keypair not found for ${pubkey}`);
}

export function resolveGroup(name?: string): string {
  return name && name.trim() ? name.trim() : process.env.KEYMAKER_GROUP || 'bundle';
}


