import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { db, wallets as tWallets } from "./db";
import { eq } from "drizzle-orm";
import { readSecretFromKeystore } from "./wallets";

export async function getKeypairForPubkey(pubkey: string): Promise<Keypair | null> {
  const dev = process.env.MASTER_SECRET_BASE58;
  if (dev) {
    const kp = Keypair.fromSecretKey(bs58.decode(dev));
    if (kp.publicKey.toBase58() === pubkey) return kp;
  }
  const rows = (await db.select().from(tWallets).where(eq(tWallets.pubkey, pubkey))) as any[];
  if (!rows.length) return null;
  const secret = await readSecretFromKeystore(pubkey);
  if (!secret) return null;
  const kp = Keypair.fromSecretKey(bs58.decode(secret));
  return kp;
}


