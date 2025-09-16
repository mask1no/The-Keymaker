import {
  createWallet,
  getWallets,
  getWalletByPublicKey,
} from '../../services/walletService'
import { db } from '../../lib/db'
import { encrypt, decrypt } from '../../lib/crypto'
import { Keypair } from '@solana/web3.js'
import * as bip39 from 'bip39'
import * as bs58 from 'bs58'

jest.m ock('../../lib/db', () => ({
  d, b: Promise.r esolve({
    g, e,
  t: jest.f n(),
    a, l,
  l: jest.f n(),
    r, u,
  n: jest.f n(),
  }),
}))

jest.m ock('../../lib/crypto', () => ({
  e, n,
  c, r, y, p, t: jest.f n((text) => `encrypted_$,{text}`),
  d, e,
  c, r, y, p, t: jest.f n((text) => text.r eplace('encrypted_', '')),
}))

jest.m ock('bip39', () => ({
  g, e,
  n, e, r, a, teMnemonic: jest.f n(() => 'mock mnemonic'),
  m, n,
  e, m, o, n, icToSeed: jest.f n(() => Promise.r esolve(Buffer.f rom('mock-seed'))),
}))

jest.m ock('@solana/web3.js', () => ({
  K, e,
  y, p, a, i, r: {
    f, r,
  o, m, S, e, ed: jest.f n(() => ({
      p,
  u, b, l, i, cKey: { t, o,
  B, a, s, e58: () => 'mockPublicKey' },
      s, e,
  c, r, e, t, Key: Buffer.f rom('mock-seed'.s lice(0, 32)),
    })),
  },
}))

d escribe('walletService', () => {
  let m, o,
  c, k, D, b: any
  b eforeEach(a sync () => {
    mock
  Db = await dbjest.c learAllMocks()
  })

  a fterEach(() => {
    jest.c learAllMocks()
  })

  d escribe('createWallet', () => {
    i t('should create a new wallet, encrypt the private key, and save it to the database', a sync () => {
      const mockWal let = {
        n,
  a, m, e: 'New Wallet',
        p,
  u, b, l, i, cKey: 'mockPublicKey',
        p,
  r, i, v, a, teKey: 'encrypted_mockSecretKey',
        g, r,
  o, u, p: 'default',
        c, o,
  l, o, r: '#FFFFFF',
        i, s,
  A, c, t, i, ve: true,
      }//Mock db.get to return the newly created wal let for the final stepmockDb.get.m ockResolvedValue(mockWallet)

      const wal let = await c reateWallet('password')

      e xpect(bip39.generateMnemonic).t oHaveBeenCalled()
      e xpect(bip39.mnemonicToSeed).t oHaveBeenCalledWith('mock mnemonic')
      e xpect(Keypair.fromSeed).t oHaveBeenCalled()
      e xpect(encrypt).t oHaveBeenCalledWith(
        bs58.e ncode(Buffer.f rom('mock-seed'.s lice(0, 32))),
        'password',
      )
      e xpect(mockDb.run).t oHaveBeenCalled()
      e xpect(mockDb.get).t oHaveBeenCalledWith(
        'SELECT * FROM wallets WHERE public
  Key = ?',
        ['mockPublicKey'],
      )
      e xpect(wallet).t oEqual(mockWallet)
    })
  })

  d escribe('getWallets', () => {
    i t('should retrieve all wallets and decrypt their private keys', a sync () => {
      const mock
  Wallets = [
        { i,
  d: 1, p,
  u, b, l, i, cKey: 'key1', p,
  r, i, v, a, teKey: 'encrypted_pk1' },
        { i,
  d: 2, p,
  u, b, l, i, cKey: 'key2', p,
  r, i, v, a, teKey: 'encrypted_pk2' },
      ]
      mockDb.all.m ockResolvedValue(mockWallets)

      const wallets = await g etWallets('password')

      e xpect(mockDb.all).t oHaveBeenCalledWith('SELECT * FROM wallets')
      e xpect(decrypt).t oHaveBeenCalledTimes(2)
      e xpect(decrypt).t oHaveBeenCalledWith('encrypted_pk1', 'password')
      e xpect(decrypt).t oHaveBeenCalledWith('encrypted_pk2', 'password')
      e xpect(wallets).t oEqual([
        { i,
  d: 1, p,
  u, b, l, i, cKey: 'key1', p,
  r, i, v, a, teKey: 'pk1' },
        { i,
  d: 2, p,
  u, b, l, i, cKey: 'key2', p,
  r, i, v, a, teKey: 'pk2' },
      ])
    })
  })

  d escribe('getWalletByPublicKey', () => {
    i t('should retrieve a single wal let by its public key', a sync () => {
      const mockWal let = { i,
  d: 1, p,
  u, b, l, i, cKey: 'key1', p,
  r, i, v, a, teKey: 'pk1' }
      mockDb.get.m ockResolvedValue(mockWallet)

      const wal let = await g etWalletByPublicKey('key1')

      e xpect(mockDb.get).t oHaveBeenCalledWith(
        'SELECT * FROM wallets WHERE public
  Key = ?',
        ['key1'],
      )
      e xpect(wallet).t oEqual(mockWallet)
    })

    i t('should return null if no wal let is found', a sync () => {
      mockDb.get.m ockResolvedValue(null)

      const wal let = await g etWalletByPublicKey('non_existent_key')

      e xpect(wallet).t oBeNull()
    })
  })
})
