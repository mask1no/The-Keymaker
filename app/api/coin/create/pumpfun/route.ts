import { NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { Connection, Keypair } from '@solana/web3.js';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { buildCreateMintTx } from '@/lib/tx/pumpfun';
import { getDb } from '@/lib/db/sqlite';
import { readFileSync } from 'fs';

const createSchema = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  uri: z.string().url(),
});

function getMasterKeypair(): Keypair {
  const keypairPath = process.env.KEYPAIR_JSON;
  if (!keypairPath) {
    throw new Error('KEYPAIR_JSON env var not set');
  }
  const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(keypairData));
}

function getRpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
}

export const POST = withSessionAndLimit(async (request, { userPubkey }) => {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);

    const master = getMasterKeypair();
    const connection = new Connection(getRpcUrl(), 'confirmed');

    // Build and send create transaction
    const tx = await buildCreateMintTx({
      master,
      name: validated.name,
      symbol: validated.symbol,
      uri: validated.uri,
      connection,
    });

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(signature, 'confirmed');

    // Extract mint address from transaction (simplified - real impl would parse from logs)
    const mintAddress = 'GENERATED_MINT_ADDRESS'; // TODO: Parse from tx logs

    // Record in dev_mints table
    const db = await getDb();
    await db.run(
      'INSERT INTO dev_mints (mint, dev_wallet, created_at) VALUES (?, ?, ?)',
      [mintAddress, userPubkey, Date.now()]
    );

    return NextResponse.json({
      success: true,
      mint: mintAddress,
      signature,
      name: validated.name,
      symbol: validated.symbol,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create token',
      },
      { status: 500 }
    );
  }
});

