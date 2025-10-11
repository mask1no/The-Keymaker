#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bs58 from 'bs58';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const target = process.env.KEYPAIR_JSON || './keypairs/dev-payer.json';
  const abs = join(process.cwd(), target);
  const dir = dirname(abs);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(abs)) {
    console.log(`Keypair already exists at ${target}`);
    return;
  }
  // Lazy import to avoid pulling web3 in runtime
  const { Keypair } = await import('@solana/web3.js');
  const kp = Keypair.generate();
  const arr = Array.from(kp.secretKey);
  writeFileSync(abs, JSON.stringify(arr, null, 2));
  console.log(`Wrote dev keypair at ${target} (pubkey=${kp.publicKey.toBase58()})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
