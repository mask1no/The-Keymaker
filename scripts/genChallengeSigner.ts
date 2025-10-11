import { Keypair } from '@solana/web3.js';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('config', { recursive: true });
const kp = Keypair.generate();
writeFileSync('config/challenge-signer.json', JSON.stringify(Array.from(kp.secretKey), null, 2));
console.log('Wrote config/challenge-signer.json (DO NOT COMMIT)');

import { Keypair } from '@solana/web3.js';
import { writeFileSync, mkdirSync } from 'fs';

function main(): void {
  mkdirSync('config', { recursive: true });
  const kp = Keypair.generate();
  writeFileSync('config/challenge-signer.json', JSON.stringify(Array.from(kp.secretKey), null, 2));
  // eslint-disable-next-line no-console
  console.log('Wrote config/challenge-signer.json (DO NOT COMMIT)');
}

main();
