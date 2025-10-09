import { NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { Connection, Keypair } from '@solana/web3.js';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { startVolumeRun } from '@/lib/volume/runner';
import { getDb } from '@/lib/db/sqlite';
import bs58 from 'bs58';
import { decrypt } from '@/lib/crypto';

const startSchema = z.object({
  profileId: z.number().int().positive(),
  password: z.string().min(1),
});

function getRpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
}

export const POST = withSessionAndLimit(async (request) => {
  try {
    const body = await request.json();
    const validated = startSchema.parse(body);

    const db = await getDb();
    const connection = new Connection(getRpcUrl(), 'confirmed');

    // Load profile
    const profile = await db.get('SELECT * FROM volume_profiles WHERE id = ?', [
      validated.profileId,
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Load and decrypt wallets
    const walletPubkeys = JSON.parse(profile.wallet_pubkeys);
    const walletKeypairs: Keypair[] = [];

    for (const pubkey of walletPubkeys) {
      const wallet = await db.get('SELECT * FROM wallets WHERE address = ?', [pubkey]);

      if (!wallet) {
        continue; // Skip missing wallets
      }

      try {
        const decryptedKey = decrypt(wallet.keypair, validated.password);
        const keypair = Keypair.fromSecretKey(bs58.decode(decryptedKey));
        walletKeypairs.push(keypair);
      } catch {
        return NextResponse.json(
          { error: `Invalid password for wallet ${pubkey}` },
          { status: 401 },
        );
      }
    }

    if (walletKeypairs.length === 0) {
      return NextResponse.json({ error: 'No valid wallets loaded' }, { status: 400 });
    }

    // Start volume run
    const runId = await startVolumeRun(validated.profileId, walletKeypairs, connection);

    return NextResponse.json({
      success: true,
      runId,
      profileId: validated.profileId,
      walletsLoaded: walletKeypairs.length,
      status: 'running',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start volume bot',
      },
      { status: 500 },
    );
  }
});
