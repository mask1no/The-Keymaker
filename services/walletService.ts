import { Connection, Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import { WalletProps } from '../lib/types';

// Use Helius RPC from env
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';
const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com', 'confirmed');

// Assuming Jito client is set up elsewhere, placeholder for bundling
// import jitoClient from '../jitoSetup'; // To be implemented

export async function createWallet(password: string): Promise<WalletProps> {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
  const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKeyBase64, password).toString();
  return { publicKey, encryptedPrivateKey, role: 'normal', balance: 0 };
}

export async function fundWallets(masterPrivateKey: string, wallets: string[], minSol: number, maxSol: number): Promise<string[]> {
  const master = Keypair.fromSecretKey(Buffer.from(masterPrivateKey, 'base64'));
  const txs: Transaction[] = [];
  for (const wallet of wallets) {
    const amount = Math.random() * (maxSol - minSol) + minSol;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: master.publicKey,
        toPubkey: new PublicKey(wallet),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    txs.push(tx);
  }
  // Bundle with Jito
  // const bundleSigs = await jitoClient.executeBundle(txs);
  // For now, send individually
  const sigs = [];
  for (const tx of txs) {
    const sig = await connection.sendTransaction(tx, [master]);
    sigs.push(sig);
  }
  return sigs;
}

export async function sendSol(fromPrivateKey: string, to: string, amount: number): Promise<string> {
  const from = Keypair.fromSecretKey(Buffer.from(fromPrivateKey, 'base64'));
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey(to),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  return await connection.sendTransaction(tx, [from]);
} 