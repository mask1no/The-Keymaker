import { validateToken, generateApiToken, validateTokenConfiguration } from '@/lib/auth/tokens';

describe('Token Authentication', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateApiToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateApiToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateApiToken();
      const token2 = generateApiToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateToken', () => {
    beforeEach(() => {
      process.env.ENGINE_API_TOKEN = 'a'.repeat(64); // Valid 64-char token
    });

    it('should validate correct token', () => {
      expect(validateToken('a'.repeat(64))).toBe(true);
    });

    it('should reject null token', () => {
      expect(validateToken(null)).toBe(false);
    });

    it('should reject undefined token', () => {
      expect(validateToken(undefined)).toBe(false);
    });

    it('should reject empty token', () => {
      expect(validateToken('')).toBe(false);
    });

    it('should reject short token', () => {
      expect(validateToken('short')).toBe(false);
    });

    it('should reject wrong token', () => {
      expect(validateToken('b'.repeat(64))).toBe(false);
    });

    it('should reject when no env token configured', () => {
      delete process.env.ENGINE_API_TOKEN;
      expect(validateToken('a'.repeat(64))).toBe(false);
    });
  });

  describe('validateTokenConfiguration', () => {
    it('should pass with valid configuration', () => {
      process.env.ENGINE_API_TOKEN = 'a'.repeat(64);
      process.env.KEYMAKER_SESSION_SECRET = 'b'.repeat(64);
      
      const result = validateTokenConfiguration();
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail with missing tokens', () => {
      delete process.env.ENGINE_API_TOKEN;
      delete process.env.KEYMAKER_SESSION_SECRET;
      
      const result = validateTokenConfiguration();
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('ENGINE_API_TOKEN not configured');
      expect(result.issues).toContain('KEYMAKER_SESSION_SECRET not configured');
    });

    it('should fail with short tokens', () => {
      process.env.ENGINE_API_TOKEN = 'short';
      process.env.KEYMAKER_SESSION_SECRET = 'short';
      
      const result = validateTokenConfiguration();
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('ENGINE_API_TOKEN too short (minimum 32 characters)');
      expect(result.issues).toContain('KEYMAKER_SESSION_SECRET too short (minimum 32 characters)');
    });

    it('should fail with placeholder values', () => {
      process.env.ENGINE_API_TOKEN = 'generate-a-real-token-here';
      process.env.KEYMAKER_SESSION_SECRET = 'generate-a-32-character-hex-secret-here';
      
      const result = validateTokenConfiguration();
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('ENGINE_API_TOKEN is still using placeholder value');
      expect(result.issues).toContain('KEYMAKER_SESSION_SECRET is still using placeholder value');
    });
  });
});
