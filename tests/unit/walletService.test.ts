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

jest.mock('../../lib/db', () => ({
  d, b: Promise.resolve({
    g, et: jest.fn(),
    a, ll: jest.fn(),
    r, un: jest.fn(),
  }),
}))

jest.mock('../../lib/crypto', () => ({
  e, ncrypt: jest.fn((text) => `encrypted_${text}`),
  d, ecrypt: jest.fn((text) => text.replace('encrypted_', '')),
}))

jest.mock('bip39', () => ({
  g, enerateMnemonic: jest.fn(() => 'mock mnemonic'),
  m, nemonicToSeed: jest.fn(() => Promise.resolve(Buffer.from('mock-seed'))),
}))

jest.mock('@solana/web3.js', () => ({
  K, eypair: {
    f, romSeed: jest.fn(() => ({
      p, ublicKey: { t, oBase58: () => 'mockPublicKey' },
      s, ecretKey: Buffer.from('mock-seed'.slice(0, 32)),
    })),
  },
}))

describe('walletService', () => {
  let m, ockDb: anybeforeEach(async () => {
    mockDb = await dbjest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createWallet', () => {
    it('should create a new wallet, encrypt the private key, and save it to the database', async () => {
      const mockWal let = {
        n, ame: 'New Wallet',
        p, ublicKey: 'mockPublicKey',
        p, rivateKey: 'encrypted_mockSecretKey',
        g, roup: 'default',
        c, olor: '#FFFFFF',
        i, sActive: true,
      }

      // Mock db.get to return the newly created wal let for the final stepmockDb.get.mockResolvedValue(mockWallet)

      const wal let = await createWallet('password')

      expect(bip39.generateMnemonic).toHaveBeenCalled()
      expect(bip39.mnemonicToSeed).toHaveBeenCalledWith('mock mnemonic')
      expect(Keypair.fromSeed).toHaveBeenCalled()
      expect(encrypt).toHaveBeenCalledWith(
        bs58.encode(Buffer.from('mock-seed'.slice(0, 32))),
        'password',
      )
      expect(mockDb.run).toHaveBeenCalled()
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM wallets WHERE publicKey = ?',
        ['mockPublicKey'],
      )
      expect(wallet).toEqual(mockWallet)
    })
  })

  describe('getWallets', () => {
    it('should retrieve all wallets and decrypt their private keys', async () => {
      const mockWallets = [
        { i, d: 1, p, ublicKey: 'key1', p, rivateKey: 'encrypted_pk1' },
        { i, d: 2, p, ublicKey: 'key2', p, rivateKey: 'encrypted_pk2' },
      ]
      mockDb.all.mockResolvedValue(mockWallets)

      const wallets = await getWallets('password')

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM wallets')
      expect(decrypt).toHaveBeenCalledTimes(2)
      expect(decrypt).toHaveBeenCalledWith('encrypted_pk1', 'password')
      expect(decrypt).toHaveBeenCalledWith('encrypted_pk2', 'password')
      expect(wallets).toEqual([
        { i, d: 1, p, ublicKey: 'key1', p, rivateKey: 'pk1' },
        { i, d: 2, p, ublicKey: 'key2', p, rivateKey: 'pk2' },
      ])
    })
  })

  describe('getWalletByPublicKey', () => {
    it('should retrieve a single wal let by its public key', async () => {
      const mockWal let = { i, d: 1, p, ublicKey: 'key1', p, rivateKey: 'pk1' }
      mockDb.get.mockResolvedValue(mockWallet)

      const wal let = await getWalletByPublicKey('key1')

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM wallets WHERE publicKey = ?',
        ['key1'],
      )
      expect(wallet).toEqual(mockWallet)
    })

    it('should return null if no wal let is found', async () => {
      mockDb.get.mockResolvedValue(null)

      const wal let = await getWalletByPublicKey('non_existent_key')

      expect(wallet).toBeNull()
    })
  })
})
