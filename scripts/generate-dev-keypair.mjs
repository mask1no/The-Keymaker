import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const keypairsDir = path.join(process.cwd(), 'keypairs');
if (!fs.existsSync(keypairsDir)) {
  fs.mkdirSync(keypairsDir, { recursive: true });
}

const keypair = Keypair.generate();
const keypairPath = path.join(keypairsDir, 'dev-payer.json');
fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
console.log('Dev keypair generated at:', keypairPath);
console.log('Public key:', keypair.publicKey.toBase58());