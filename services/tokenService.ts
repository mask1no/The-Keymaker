import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from '@metaplex-foundation/umi'
import {
  createV1,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata'
import { Keypair, Connection } from '@solana/web3.js'
import { getServerRpc } from '@/lib/server/rpc'

// Define the structure for token creation parameters
export interface CreateTokenParams {
  name: string
  symbol: string
  decimals: number
  supply: number
  description: string
  image: Buffer // Using Buffer for image data
  wallet: Keypair // The wallet creating the token
}

/**
 * Creates a new SPL token with metadata.
 * @param params - The parameters for creating the token.
 * @returns The address of the newly created token mint.
 */
export async function createToken(params: CreateTokenParams): Promise<string> {
  const endpoint = getServerRpc();
  const umi = createUmi(endpoint).use(mplTokenMetadata())

  const walletKeypair = umi.eddsa.createKeypairFromSecretKey(params.wallet.secretKey);

  umi.use(signerIdentity(createSignerFromKeypair(umi, walletKeypair)))

  const mint = generateSigner(umi)

  await createV1(umi, {
    mint,
    authority: umi.identity,
    name: params.name,
    symbol: params.symbol,
    uri: '', // You might want to upload metadata to Arweave or IPFS and get a URI
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi)

  await mintV1(umi, {
    mint: mint.publicKey,
    authority: umi.identity,
    amount: params.supply,
    tokenOwner: umi.identity.publicKey,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi)

  return mint.publicKey.toString()
}
