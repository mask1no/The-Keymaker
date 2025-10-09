import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';
import { buildCreateMintTx, uploadMetadataToIPFS } from '@/lib/tx/pumpfun';
import { Connection, Keypair } from '@solana/web3.js';
import { getDb } from '@/lib/db/sqlite';

const createSchema = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  description: z.string().optional(),
  image: z.string().url().optional(),
  supply: z.number().min(1).max(1000000000).optional(),
  decimals: z.number().min(0).max(18).optional(),
});

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { limit: rateLimitNum, windowMs } = getRateConfig('submit');
  const rateLimitResult = rateLimit(session.sub, rateLimitNum, windowMs);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const validatedData = createSchema.parse(body);

    // Get RPC URL from environment
    const rpcUrl = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // For now, we'll use a placeholder keypair
    // In a real implementation, you'd get this from the user's wallet
    const masterKeypair = Keypair.generate();

    // Upload metadata to IPFS if image is provided
    let metadataUri = 'https://via.placeholder.com/500x500.png';
    if (validatedData.image) {
      try {
        metadataUri = await uploadMetadataToIPFS({
          name: validatedData.name,
          symbol: validatedData.symbol,
          description: validatedData.description || `A memecoin created with The Keymaker`,
          image: validatedData.image,
        });
      } catch (error) {
        console.warn('Failed to upload metadata to IPFS, using placeholder:', error);
      }
    }

    // Build the transaction
    const transaction = await buildCreateMintTx({
      master: masterKeypair,
      name: validatedData.name,
      symbol: validatedData.symbol,
      uri: metadataUri,
      connection,
      decimals: validatedData.decimals || 9,
      supply: validatedData.supply || 1000000000,
    });

    // Serialize the transaction for the client
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    // Log the token creation attempt
    const db = getDb();
    db.run(
      'INSERT INTO token_creations (user_id, name, symbol, metadata_uri, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        session.sub,
        validatedData.name,
        validatedData.symbol,
        metadataUri,
        'pending',
        new Date().toISOString(),
      ]
    );

    return NextResponse.json({
      success: true,
      transaction: serializedTransaction,
      mintAddress: masterKeypair.publicKey.toBase58(),
      metadataUri,
      message: 'Token creation transaction ready. Please sign and submit the transaction.',
    });

  } catch (error) {
    console.error('Token creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Token creation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
