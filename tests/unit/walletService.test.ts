import { createWallet, getWallets, getWalletByPublicKey } from '../../services/walletService';
import { db } from '../../lib/db';
import { encrypt, decrypt } from '../../lib/crypto';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as bs58 from 'bs58';
jest.mock('../../lib/db', () => ({
  db: Promise.resolve({ get: jest.fn(), all: jest.fn(), run: jest.fn() }),
}));
jest.mock('../../lib/crypto', () => ({
  encrypt: jest.fn((t: string) => `encrypted_${t}`),
  decrypt: jest.fn((t: string) => t.replace('encrypted_', '')),
}));
jest.mock('bip39', () => ({
  generateMnemonic: jest.fn(() => 'mock mnemonic'),
  mnemonicToSeed: jest.fn(() => Promise.resolve(Buffer.from('mock-seed'))),
}));
jest.mock('@solana/web3.js', () => ({
  Keypair: {
    fromSecretKey: jest.fn(() => ({
      publicKey: { toBase58: () => 'mockPublicKey' },
      secretKey: Buffer.from('mock-seed'.slice(0, 32)),
    })),
  },
}));
describe('walletService', () => {
  let mockDb: any;
  beforeEach(async () => {
    mockDb = await db;
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createWallet', () => {
    it('creates wallet and saves to db', async () => {
      const wallet = await createWallet('password');
      expect(bip39.generateMnemonic).toHaveBeenCalled();
      expect(bip39.mnemonicToSeed).toHaveBeenCalledWith('mock mnemonic');
      expect(encrypt).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalled();
      expect(wallet.publicKey).toBeDefined();
    });
  });
  describe('getWallets', () => {
    it('retrieves and decrypts wallets', async () => {
      mockDb.all.mockResolvedValue([
        { address: 'key1', keypair: 'encrypted_pk1' },
        { address: 'key2', keypair: 'encrypted_pk2' },
      ]);
      const wallets = await getWallets('password');
      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM wallets');
      expect(decrypt).toHaveBeenCalledTimes(2);
      expect(wallets.length).toBe(2);
    });
  });
  describe('getWalletByPublicKey', () => {
    it('retrieves one by public key', async () => {
      const mockWallet = { id: 1, address: 'key1', keypair: 'pk1' };
      mockDb.get.mockResolvedValue(mockWallet);
      const wallet = await getWalletByPublicKey('key1');
      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM wallets WHERE address = ?', ['key1']);
      expect(wallet?.publicKey || (wallet as any).address).toBe('key1');
    });
  });
});
