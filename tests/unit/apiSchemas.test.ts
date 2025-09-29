import { z } from 'zod';

// Test schemas from API routes
const RpcBuySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10000).default(150),
  priorityFeeMicrolamports: z.number().min(0).default(10000),
  concurrency: z.number().min(1).max(16).default(5),
  timeoutMs: z.number().min(1000).max(120000).default(20000),
  dryRun: z.boolean().default(true),
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  masterWallet: z.string().optional(),
  numberOfWallets: z.number().min(1).max(20),
});

const NonceRequestSchema = z.object({
  pubkey: z.string().min(32).max(44),
});

describe('API Schemas', () => {
  describe('RpcBuySchema', () => {
    it('should validate correct input', () => {
      const valid = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountSol: 0.1,
        slippageBps: 150,
      };
      
      const result = RpcBuySchema.parse(valid);
      expect(result.dryRun).toBe(true); // Safe default
      expect(result.concurrency).toBe(5); // Default
    });
    
    it('should reject invalid groupId', () => {
      const invalid = {
        groupId: 'not-a-uuid',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountSol: 0.1,
      };
      
      expect(() => RpcBuySchema.parse(invalid)).toThrow();
    });
    
    it('should reject invalid slippage', () => {
      const invalid = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountSol: 0.1,
        slippageBps: 15000, // Over 10000 max
      };
      
      expect(() => RpcBuySchema.parse(invalid)).toThrow();
    });
    
    it('should enforce safe defaults', () => {
      const minimal = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountSol: 0.1,
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
        name: 'my_group',
        numberOfWallets: 8,
      };
      
      const result = CreateGroupSchema.parse(valid);
      expect(result.name).toBe('my_group');
      expect(result.numberOfWallets).toBe(8);
    });
    
    it('should reject too many wallets', () => {
      const invalid = {
        name: 'big_group',
        numberOfWallets: 25, // Over 20 max
      };
      
      expect(() => CreateGroupSchema.parse(invalid)).toThrow();
    });
    
    it('should reject empty name', () => {
      const invalid = {
        name: '',
        numberOfWallets: 5,
      };
      
      expect(() => CreateGroupSchema.parse(invalid)).toThrow();
    });
  });
  
  describe('NonceRequestSchema', () => {
    it('should validate Solana pubkey', () => {
      const valid = {
        pubkey: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      };
      
      const result = NonceRequestSchema.parse(valid);
      expect(result.pubkey).toBe(valid.pubkey);
    });
    
    it('should reject short keys', () => {
      const invalid = {
        pubkey: 'tooshort',
      };
      
      expect(() => NonceRequestSchema.parse(invalid)).toThrow();
    });
  });
});
