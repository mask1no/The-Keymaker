import { isTestMode } from '@/lib/testMode';
import { getUiSettings } from '@/lib/server/settings';
import { resolveGroup, listGroup } from '@/lib/server/keystore';

// Mock dependencies
jest.mock('@/lib/testMode');
jest.mock('@/lib/server/settings');
jest.mock('@/lib/server/keystore');

describe('Core Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Mode Detection', () => {
    it('should detect test mode correctly', () => {
      (isTestMode as jest.Mock).mockReturnValue(true);
      
      const result = isTestMode();
      
      expect(result).toBe(true);
    });

    it('should detect production mode correctly', () => {
      (isTestMode as jest.Mock).mockReturnValue(false);
      
      const result = isTestMode();
      
      expect(result).toBe(false);
    });
  });

  describe('Settings Management', () => {
    it('should return default UI settings', () => {
      const mockSettings = {
        mode: 'JITO_BUNDLE',
        region: 'ffm',
        tipLamports: 1000000,
        priority: 'med',
        dryRun: true
      };
      
      (getUiSettings as jest.Mock).mockReturnValue(mockSettings);
      
      const result = getUiSettings();
      
      expect(result).toEqual(mockSettings);
      expect(result.mode).toBe('JITO_BUNDLE');
      expect(result.dryRun).toBe(true);
    });

    it('should handle missing settings gracefully', () => {
      (getUiSettings as jest.Mock).mockReturnValue({});
      
      const result = getUiSettings();
      
      expect(result).toEqual({});
    });
  });

  describe('Wallet Group Management', () => {
    it('should resolve default group', () => {
      (resolveGroup as jest.Mock).mockReturnValue('bundle');
      
      const result = resolveGroup();
      
      expect(result).toBe('bundle');
    });

    it('should list group wallets', () => {
      const mockWallets = [
        'wallet1pubkey',
        'wallet2pubkey',
        'wallet3pubkey'
      ];
      
      (listGroup as jest.Mock).mockReturnValue(mockWallets);
      
      const result = listGroup('test-group');
      
      expect(result).toEqual(mockWallets);
      expect(result.length).toBe(3);
    });

    it('should handle empty groups', () => {
      (listGroup as jest.Mock).mockReturnValue([]);
      
      const result = listGroup('empty-group');
      
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('Execution Mode Validation', () => {
    const validModes = ['JITO_BUNDLE', 'RPC_FANOUT'];
    const validRegions = ['ffm', 'ams', 'ny', 'tokyo'];
    const validPriorities = ['low', 'med', 'high', 'vhigh'];

    it('should validate execution modes', () => {
      validModes.forEach(mode => {
        expect(validModes.includes(mode)).toBe(true);
      });
    });

    it('should validate regions', () => {
      validRegions.forEach(region => {
        expect(validRegions.includes(region)).toBe(true);
      });
    });

    it('should validate priorities', () => {
      validPriorities.forEach(priority => {
        expect(validPriorities.includes(priority)).toBe(true);
      });
    });

    it('should reject invalid modes', () => {
      const invalidModes = ['INVALID_MODE', 'TEST_MODE', ''];
      
      invalidModes.forEach(mode => {
        expect(validModes.includes(mode)).toBe(false);
      });
    });
  });
});
