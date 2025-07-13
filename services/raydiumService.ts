import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { createMint, mintTo, createAssociatedTokenAccount } from '@solana/spl-token';
import { Liquidity, LiquidityPoolKeys, LiquidityVersion, Percent, Token, TokenAmount } from '@raydium-io/raydium-sdk';
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';

type TokenMetadata = { name: string; ticker: string; supply: number };

async function createToken(name: string, ticker: string, supply: number, metadata: TokenMetadata, authority: Keypair, connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')): Promise<string> {
  const mint = await createMint(connection, authority, authority.publicKey, null, 9);
  const ata = await createAssociatedTokenAccount(connection, authority, mint, authority.publicKey);
  await mintTo(connection, authority, mint, ata, authority, supply * 1e9);
  // Set metadata (use Metaplex or similar for full metadata)
  return mint.toBase58();
}

async function createLiquidityPool(token: string, solAmount: number, authority: Keypair, connection: Connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')): Promise<string> {
  const mint = new PublicKey(token);
  const baseToken = new Token(mint, 9, 'TOKEN', 'TOKEN');
  const quoteToken = Token.WSOL;
  const baseAmount = new TokenAmount(baseToken, 1e9);
  const quoteAmount = new TokenAmount(quoteToken, solAmount * 1e9);
  const { poolKeys } = await Liquidity.makeCreatePoolV4InstructionV2Simple({
    connection,
    programId: Liquidity.getProgramId(LiquidityVersion.V4),
    marketId: new PublicKey('marketId'), // Placeholder
    baseMint: mint,
    quoteMint: quoteToken.mint,
    baseAmount,
    quoteAmount,
    associatedOnly: true,
    owner: authority.publicKey,
    feeTier: Percent.fromDecimal(0.0005),
  });
  // Execute tx to create pool
  const tx = new Transaction(); // Add instructions
  await connection.sendTransaction(tx, [authority]);
  return poolKeys.id.toBase58();
}

export { createToken, createLiquidityPool }; 