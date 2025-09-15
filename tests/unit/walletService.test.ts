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
  db: Promise.resolve({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  }),
}))

jest.mock('../../lib/crypto', () => ({
  encrypt: jest.fn((text) => `encrypted_${text}`),
  decrypt: jest.fn((text) => text.replace('encrypted_', '')),
}))

jest.mock('bip39', () => ({
  generateMnemonic: jest.fn(() => 'mock mnemonic'),
  mnemonicToSeed: jest.fn(() => Promise.resolve(Buffer.from('mock-seed'))),
}))

jest.mock('@solana/web3.js', () => ({
  Keypair: {
    fromSeed: jest.fn(() => ({
      publicKey: { toBase58: () => 'mockPublicKey' },
      secretKey: Buffer.from('mock-seed'.slice(0, 32)),
    })),
  },
}))

describe('walletService', () => {
  let mockDb: any

  beforeEach(async () => {
    mockDb = await db
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createWallet', () => {
    it('should create a new wallet, encrypt the private key, and save it to the database', async () => {
      const mockWallet = {
        name: 'New Wallet',
        publicKey: 'mockPublicKey',
        privateKey: 'encrypted_mockSecretKey',
        group: 'default',
        color: '#FFFFFF',
        isActive: true,
      }

      // Mock db.get to return the newly created wallet for the final step
      mockDb.get.mockResolvedValue(mockWallet)

      const wallet = await createWallet('password')

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
        { id: 1, publicKey: 'key1', privateKey: 'encrypted_pk1' },
        { id: 2, publicKey: 'key2', privateKey: 'encrypted_pk2' },
      ]
      mockDb.all.mockResolvedValue(mockWallets)

      const wallets = await getWallets('password')

      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM wallets')
      expect(decrypt).toHaveBeenCalledTimes(2)
      expect(decrypt).toHaveBeenCalledWith('encrypted_pk1', 'password')
      expect(decrypt).toHaveBeenCalledWith('encrypted_pk2', 'password')
      expect(wallets).toEqual([
        { id: 1, publicKey: 'key1', privateKey: 'pk1' },
        { id: 2, publicKey: 'key2', privateKey: 'pk2' },
      ])
    })
  })

  describe('getWalletByPublicKey', () => {
    it('should retrieve a single wallet by its public key', async () => {
      const mockWallet = { id: 1, publicKey: 'key1', privateKey: 'pk1' }
      mockDb.get.mockResolvedValue(mockWallet)

      const wallet = await getWalletByPublicKey('key1')

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM wallets WHERE publicKey = ?',
        ['key1'],
      )
      expect(wallet).toEqual(mockWallet)
    })

    it('should return null if no wallet is found', async () => {
      mockDb.get.mockResolvedValue(null)

      const wallet = await getWalletByPublicKey('non_existent_key')

      expect(wallet).toBeNull()
    })
  })
})
