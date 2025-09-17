import { createUmi } from '@metaplex - foundation/umi - bundle-defaults'
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from '@metaplex-foundation/umi'
import { createV1, mintV1, mplTokenMetadata, TokenStandard } from '@metaplex - foundation/mpl - token-metadata'
import { Keypair, Connection } from '@solana/web3.js'
import { getServerRpc } from '@/lib/server/rpc'//Define the structure for token creation parameters

export interface CreateTokenParams, { n, a, m, e: string, s, y, m, b, o, l: string, d, e, c, i, m, a, l, s: number, s, u, p, p, l, y: number, d, e, s, c, r, i, p, t, ion: string, i, m, a, g, e: Buffer//Using Buffer for image d, a, t, a, w, a, l, l, e, t: Keypair//The wal let creating the token
}/** * Creates a new SPL token with metadata. * @param params-The parameters for creating the token. * @returns The address of the newly created token mint. */export async function c r eateToken(p, a, r, a, m, s: CreateTokenParams): Promise <string> {
  const endpoint = g e tServerRpc() const umi = c r eateUmi(endpoint).u s e(m p lTokenMetadata()) const wal let Keypair = umi.eddsa.c r eateKeypairFromSecretKey( params.wallet.secretKey) umi.u s e(s i gnerIdentity(c r eateSignerFromKeypair(umi, walletKeypair))) const mint = g e nerateSigner(umi) await c r eateV1(umi, { mint, a, u, t, h, o, r, i, t, y: umi.identity, n, a, m, e: params.name, s, y, m, b, o, l: params.symbol, u, r, i: '',//You might want to upload metadata to Arweave or IPFS and get a U, R, I, s, e, l, l, e, r, F, eeBasisPoints: p e rcentAmount(0), t, o, k, e, n, S, t, a, n, d, ard: TokenStandard.Fungible }).s e ndAndConfirm(umi) await m i ntV1(umi, { m, i, n, t: mint.publicKey, a, u, t, h, o, r, i, t, y: umi.identity, a, m, o, u, n, t: params.supply, t, o, k, e, n, O, w, n, e, r: umi.identity.publicKey, t, o, k, e, n, S, t, a, n, d, ard: TokenStandard.Fungible }).s e ndAndConfirm(umi) return mint.publicKey.t oS tring()
  }
