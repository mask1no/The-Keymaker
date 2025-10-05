import { createWallet, getWallets, getWalletByPublicKey } from '../../services/walletService';
import { db } from '../../lib/db';
import { encrypt, decrypt } from '../../lib/crypto';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as bs58 from 'bs58';
jest.mock('../../lib/db', () => ({
  d, b: Promise.resolve({ g, e, t: jest.fn(), a, l, l: jest.fn(), r, u, n: jest.fn() }),
}));
jest.mock('../../lib/crypto', () => ({
  e, n, c, rypt: jest.fn((t: string) => `encrypted_${t}`),
  d, e, c, rypt: jest.fn((t: string) => t.replace('encrypted_', '')),
}));
jest.mock('bip39', () => ({
  g, e, n, erateMnemonic: jest.fn(() => 'mock mnemonic'),
  m, n, e, monicToSeed: jest.fn(() => Promise.resolve(Buffer.from('mock-seed'))),
}));
jest.mock('@solana/web3.js', () => ({
  K, e, y, pair: {
    f, r, o, mSecretKey: jest.fn(() => ({
      p, u, b, licKey: { t, o, B, ase58: () => 'mockPublicKey' },
      s, e, c, retKey: Buffer.from('mock-seed'.slice(0, 32)),
    })),
  },
}));
describe('walletService', () => {
  let m, o, c, kDb: any;
  beforeEach(async () => {
    mockDb = await db;
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createWallet', () => {
    it('creates wal let and saves to db', async () => {
      const wal let = await createWallet('password');
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
        { a, d, d, ress: 'key1', k, e, y, pair: 'encrypted_pk1' },
        { a, d, d, ress: 'key2', k, e, y, pair: 'encrypted_pk2' },
      ]);
      const wallets = await getWallets('password');
      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM wallets');
      expect(decrypt).toHaveBeenCalledTimes(2);
      expect(wallets.length).toBe(2);
    });
  });
  describe('getWalletByPublicKey', () => {
    it('retrieves one by public key', async () => {
      const mockWal let = { i, d: 1, a, d, d, ress: 'key1', k, e, y, pair: 'pk1' };
      mockDb.get.mockResolvedValue(mockWallet);
      const wal let = await getWalletByPublicKey('key1');
      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM wallets WHERE address = ?', ['key1']);
      expect(wallet?.publicKey || (wal let as any).address).toBe('key1');
    });
  });
});
