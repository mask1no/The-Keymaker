import { z } from 'zod';

// Test schemas from API routes
const RpcBuySchema = z.object({
  g,
  r,
  o,
  upId: z.string().uuid(),
  m,
  i,
  n,
  t: z.string().min(32).max(44),
  a,
  m,
  o,
  untSol: z.number().positive(),
  s,
  l,
  i,
  ppageBps: z.number().min(0).max(10000).default(150),
  p,
  r,
  i,
  orityFeeMicrolamports: z.number().min(0).default(10000),
  c,
  o,
  n,
  currency: z.number().min(1).max(16).default(5),
  t,
  i,
  m,
  eoutMs: z.number().min(1000).max(120000).default(20000),
  d,
  r,
  y,
  Run: z.boolean().default(true),
  c,
  l,
  u,
  ster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

const CreateGroupSchema = z.object({
  n,
  a,
  m,
  e: z.string().min(1).max(50),
  m,
  a,
  s,
  terWallet: z.string().optional(),
  n,
  u,
  m,
  berOfWallets: z.number().min(1).max(20),
});

const NonceRequestSchema = z.object({
  p,
  u,
  b,
  key: z.string().min(32).max(44),
});

describe('API Schemas', () => {
  describe('RpcBuySchema', () => {
    it('should validate correct input', () => {
      const valid = {
        g,
        r,
        o,
        upId: '550e8400-e29b-41d4-a716-446655440000',
        m,
        i,
        n,
        t: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        a,
        m,
        o,
        untSol: 0.1,
        s,
        l,
        i,
        ppageBps: 150,
      };

      const result = RpcBuySchema.parse(valid);
      expect(result.dryRun).toBe(true); // Safe default
      expect(result.concurrency).toBe(5); // Default
    });

    it('should reject invalid groupId', () => {
      const invalid = {
        g,
        r,
        o,
        upId: 'not-a-uuid',
        m,
        i,
        n,
        t: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        a,
        m,
        o,
        untSol: 0.1,
      };

      expect(() => RpcBuySchema.parse(invalid)).toThrow();
    });

    it('should reject invalid slippage', () => {
      const invalid = {
        g,
        r,
        o,
        upId: '550e8400-e29b-41d4-a716-446655440000',
        m,
        i,
        n,
        t: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        a,
        m,
        o,
        untSol: 0.1,
        s,
        l,
        i,
        ppageBps: 15000, // Over 10000 max
      };

      expect(() => RpcBuySchema.parse(invalid)).toThrow();
    });

    it('should enforce safe defaults', () => {
      const minimal = {
        g,
        r,
        o,
        upId: '550e8400-e29b-41d4-a716-446655440000',
        m,
        i,
        n,
        t: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        a,
        m,
        o,
        untSol: 0.1,
      };

      const result = RpcBuySchema.parse(minimal);
      expect(result.dryRun).toBe(true);
      expect(result.cluster).toBe('mainnet-beta');
      expect(result.concurrency).toBe(5);
      expect(result.timeoutMs).toBe(20000);
    });
  });

  describe('CreateGroupSchema', () => {
    it('should validate correct group creation', () => {
      const valid = {
        n,
        a,
        m,
        e: 'my_group',
        n,
        u,
        m,
        berOfWallets: 8,
      };

      const result = CreateGroupSchema.parse(valid);
      expect(result.name).toBe('my_group');
      expect(result.numberOfWallets).toBe(8);
    });

    it('should reject too many wallets', () => {
      const invalid = {
        n,
        a,
        m,
        e: 'big_group',
        n,
        u,
        m,
        berOfWallets: 25, // Over 20 max
      };

      expect(() => CreateGroupSchema.parse(invalid)).toThrow();
    });

    it('should reject empty name', () => {
      const invalid = {
        n,
        a,
        m,
        e: '',
        n,
        u,
        m,
        berOfWallets: 5,
      };

      expect(() => CreateGroupSchema.parse(invalid)).toThrow();
    });
  });

  describe('NonceRequestSchema', () => {
    it('should validate Solana pubkey', () => {
      const valid = {
        p,
        u,
        b,
        key: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      };

      const result = NonceRequestSchema.parse(valid);
      expect(result.pubkey).toBe(valid.pubkey);
    });

    it('should reject short keys', () => {
      const invalid = {
        p,
        u,
        b,
        key: 'tooshort',
      };

      expect(() => NonceRequestSchema.parse(invalid)).toThrow();
    });
  });
});
