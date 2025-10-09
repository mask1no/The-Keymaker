import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock better-sqlite3
const mockDb = {
  prepare: jest.fn(() => ({
    run: jest.fn(() => ({ lastInsertRowid: 1 })),
    all: jest.fn(() => []),
    get: jest.fn(() => null),
  })),
  exec: jest.fn(),
  pragma: jest.fn(),
};

jest.mock('better-sqlite3', () => {
  return jest.fn(() => mockDb);
});

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Import after mocking
const { getDb, recordTrade, listTrades } = require('@/lib/db/sqlite');

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDb', () => {
    it('should initialize database connection', () => {
      const db = getDb();
      
      expect(db).toBeDefined();
      expect(mockDb.exec).toHaveBeenCalled();
      expect(mockDb.pragma).toHaveBeenCalledWith('journal_mode = WAL');
      expect(mockDb.pragma).toHaveBeenCalledWith('synchronous = NORMAL');
      expect(mockDb.pragma).toHaveBeenCalledWith('foreign_keys = ON');
    });

    it('should return cached instance on subsequent calls', () => {
      const db1 = getDb();
      const db2 = getDb();
      
      expect(db1).toBe(db2);
    });
  });

  describe('recordTrade', () => {
    it('should record a trade successfully', () => {
      const tradeData = {
        ts: Date.now(),
        mint: 'So11111111111111111111111111111111111111112',
        side: 'buy' as const,
        qty: 1000000,
        priceLamports: 1000000000,
        wallet: 'test-wallet',
        sig: 'test-signature',
      };

      const result = recordTrade(tradeData);
      
      expect(result).toBe(1);
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('should handle trade recording with optional fields', () => {
      const tradeData = {
        ts: Date.now(),
        mint: 'So11111111111111111111111111111111111111112',
        side: 'sell' as const,
        qty: 500000,
        priceLamports: 2000000000,
        wallet: 'test-wallet',
        sig: 'test-signature',
        feeLamports: 5000,
        priorityFeeLamports: 1000,
        note: 'Test trade',
      };

      const result = recordTrade(tradeData);
      
      expect(result).toBe(1);
    });
  });

  describe('listTrades', () => {
    it('should list trades with default parameters', () => {
      const mockTrades = [
        {
          id: 1,
          ts: Date.now(),
          mint: 'So11111111111111111111111111111111111111112',
          side: 'buy',
          qty: 1000000,
          priceLamports: 1000000000,
          wallet: 'test-wallet',
          sig: 'test-signature',
        },
      ];

      mockDb.prepare.mockReturnValue({
        all: jest.fn(() => mockTrades),
      });

      const trades = listTrades();
      
      expect(trades).toEqual(mockTrades);
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('should filter trades by mint', () => {
      const mockTrades = [
        {
          id: 1,
          ts: Date.now(),
          mint: 'So11111111111111111111111111111111111111112',
          side: 'buy',
          qty: 1000000,
          priceLamports: 1000000000,
          wallet: 'test-wallet',
          sig: 'test-signature',
        },
      ];

      mockDb.prepare.mockReturnValue({
        all: jest.fn(() => mockTrades),
      });

      const trades = listTrades({ mint: 'So11111111111111111111111111111111111111112' });
      
      expect(trades).toEqual(mockTrades);
    });

    it('should filter trades by wallet', () => {
      const mockTrades = [
        {
          id: 1,
          ts: Date.now(),
          mint: 'So11111111111111111111111111111111111111112',
          side: 'buy',
          qty: 1000000,
          priceLamports: 1000000000,
          wallet: 'test-wallet',
          sig: 'test-signature',
        },
      ];

      mockDb.prepare.mockReturnValue({
        all: jest.fn(() => mockTrades),
      });

      const trades = listTrades({ wallet: 'test-wallet' });
      
      expect(trades).toEqual(mockTrades);
    });

    it('should respect limit parameter', () => {
      const mockTrades = Array(10).fill(null).map((_, i) => ({
        id: i + 1,
        ts: Date.now(),
        mint: 'So11111111111111111111111111111111111111112',
        side: 'buy',
        qty: 1000000,
        priceLamports: 1000000000,
        wallet: 'test-wallet',
        sig: `test-signature-${i}`,
      }));

      mockDb.prepare.mockReturnValue({
        all: jest.fn(() => mockTrades),
      });

      const trades = listTrades({ limit: 10 });
      
      expect(trades).toHaveLength(10);
    });

    it('should respect offset parameter', () => {
      const mockTrades = Array(5).fill(null).map((_, i) => ({
        id: i + 1,
        ts: Date.now(),
        mint: 'So11111111111111111111111111111111111111112',
        side: 'buy',
        qty: 1000000,
        priceLamports: 1000000000,
        wallet: 'test-wallet',
        sig: `test-signature-${i}`,
      }));

      mockDb.prepare.mockReturnValue({
        all: jest.fn(() => mockTrades),
      });

      const trades = listTrades({ offset: 10 });
      
      expect(trades).toHaveLength(5);
    });
  });
});
