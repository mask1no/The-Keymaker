import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConn } from "./solana";
import { getKeypairForPubkey } from "./secrets";
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";
// Use runtime import to avoid compile-time coupling to specific @metaplex/mpl-token-metadata versions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mpl: any = require("@metaplex-foundation/mpl-token-metadata");
const createCreateMetadataAccountV3Instruction = mpl.createCreateMetadataAccountV3Instruction || mpl.createCreateMetadataAccountV2Instruction || mpl.createCreateMetadataAccountInstruction;
const METADATA_PROGRAM_ID = mpl.PROGRAM_ID || mpl.MetadataProgram?.publicKey;
import { logger } from "@keymaker/logger";

type CreateSplParams = {
  name: string;
  symbol: string;
  decimals: 6 | 9;
  metadataUri: string;
  payerPubkey: string;
};

export async function createSplTokenWithMetadata(params: CreateSplParams): Promise<{ mint: string; sig: string }> {
  const conn = getConn();
  const payer = await getKeypairForPubkey(params.payerPubkey);
  if (!payer) throw new Error("PAYER_NOT_AVAILABLE");

  const mint = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(conn);

  const ixCreateAccount = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  });

  const ixInitMint = createInitializeMintInstruction(
    mint.publicKey,
    params.decimals,
    payer.publicKey,
    payer.publicKey
  );

  const programId = typeof METADATA_PROGRAM_ID?.toBase58 === "function" ? METADATA_PROGRAM_ID : new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), programId.toBuffer(), mint.publicKey.toBuffer()],
    programId
  );

  const ixCreateMetadata = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPda,
      mint: mint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: params.name,
          symbol: params.symbol,
          uri: params.metadataUri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  const tx = new Transaction().add(ixCreateAccount, ixInitMint, ixCreateMetadata);
  tx.feePayer = payer.publicKey;

  const sig = await sendAndConfirmTransaction(conn, tx, [payer, mint], { commitment: "confirmed" });
  logger.info("coin-create", { mint: mint.publicKey.toBase58(), sig, name: params.name, symbol: params.symbol });
  return { mint: mint.publicKey.toBase58(), sig };
}

export async function mintDustToPayer(mintAddress: string, payerPubkey: string, amount = 1n) {
  const conn = getConn();
  const payer = await getKeypairForPubkey(payerPubkey);
  if (!payer) throw new Error("PAYER_NOT_AVAILABLE");
  const mint = new PublicKey(mintAddress);
  const ata = await getAssociatedTokenAddress(mint, payer.publicKey);
  const ixs: any[] = [];

  ixs.push(createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint));
  ixs.push(createMintToInstruction(mint, ata, payer.publicKey, Number(amount)));

  const tx = new Transaction().add(...ixs);
  tx.feePayer = payer.publicKey;
  const sig = await sendAndConfirmTransaction(conn, tx, [payer], { commitment: "confirmed" });
  logger.info("coin-mint-dust", { mint: mintAddress, sig, payer: payerPubkey, amount: Number(amount) });
  return sig;
}


