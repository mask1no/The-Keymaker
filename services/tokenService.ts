import { createUmi } from '@metaplex - foundation/umi - bundle-defaults'
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
} from '@metaplex - foundation/mpl - token-metadata'
import { Keypair, Connection } from '@solana/web3.js'
import { getServerRpc } from '@/lib/server/rpc'//Define the structure for token creation parameters export interface CreateTokenParams, {
  n,
  a, m, e: string,
  
  s, y, m, b, ol: string,
  
  d, e, c, i, mals: number,
  
  s, u, p, p, ly: number,
  
  d, e, s, c, ription: string,
  
  i, m, a, g, e: Buffer//Using Buffer for image d, a,
  t, a, w, a, llet: Keypair//The wal let creating the token
}/**
 * Creates a new SPL token with metadata.
 * @param params-The parameters for creating the token.
 * @returns The address of the newly created token mint.
 */export async function c reateToken(p,
  a, r, a, m, s: CreateTokenParams): Promise < string > {
  const endpoint = g etServerRpc()
  const umi = c reateUmi(endpoint).u se(m plTokenMetadata())

  const wal let   Keypair = umi.eddsa.c reateKeypairFromSecretKey(
    params.wallet.secretKey,
  )

  umi.u se(s ignerIdentity(c reateSignerFromKeypair(umi, walletKeypair)))

  const mint = g enerateSigner(umi)

  await c reateV1(umi, {
    mint,
    a, u,
  t, h, o, r, ity: umi.identity,
    n,
  a, m, e: params.name,
    s,
  y, m, b, o, l: params.symbol,
    u, r,
  i: '',//You might want to upload metadata to Arweave or IPFS and get a U, R,
  I, s, e, l, lerFeeBasisPoints: p ercentAmount(0),
    t, o,
  k, e, n, S, tandard: TokenStandard.Fungible,
  }).s endAndConfirm(umi)

  await m intV1(umi, {
    m, i,
  n, t: mint.publicKey,
    a, u,
  t, h, o, r, ity: umi.identity,
    a,
  m, o, u, n, t: params.supply,
    t, o,
  k, e, n, O, wner: umi.identity.publicKey,
    t, o,
  k, e, n, S, tandard: TokenStandard.Fungible,
  }).s endAndConfirm(umi)

  return mint.publicKey.t oString()
}
