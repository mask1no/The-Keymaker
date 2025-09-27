import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const outputDirectory = path.resolve(process.cwd(), 'config');
fs.mkdirSync(outputDirectory, { recursive: true });

const keypair = Keypair.generate();
const secretKeyBytes = Array.from(keypair.secretKey);

const outputFile = path.join(outputDirectory, 'challenge-signer.json');
fs.writeFileSync(outputFile, JSON.stringify(secretKeyBytes));

console.log(keypair.publicKey.toBase58());

