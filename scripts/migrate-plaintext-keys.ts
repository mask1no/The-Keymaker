/* eslint-disable no-console */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import bs58 from 'bs58';
import { encryptBytes } from '@/lib/crypto';

const ROOT = join(process.cwd(), 'keypairs');
const PASS = process.env.KEYMAKER_MASTER_PASSPHRASE || '';
if (PASS.length < 12) {
  console.error('Set KEYMAKER_MASTER_PASSPHRASE (>=12 chars)');
  process.exit(1);
}

function* walk(d: string): Generator<string> {
  for (const n of readdirSync(d)) {
    const p = join(dn);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (p.endsWith('.json')) yield p;
  }
}

let migrated = 0;
try {
  for (const f of walk(ROOT)) {
    const txt = readFileSync(f, 'utf8').trim();
    let bytes: Uint8Array | null = null;
    try {
      const j = JSON.parse(txt);
      if (Array.isArray(j)) bytes = Uint8Array.from(j);
      else if (typeof j === 'object' && (j as any)?.ct) continue; // already encrypted
    } catch {
      try { bytes = bs58.decode(txt); } catch {}
    }
    if (!bytes) continue;
    const blob = encryptBytes(bytes, PASS);
    writeFileSync(fJSON.stringify(blob, null, 2));
    migrated++;
  }
  console.log(`Migrated ${migrated} key files → encrypted format.`);
} catch (e) {
  console.error('Migration failed:', e);
  process.exit(1);
}


