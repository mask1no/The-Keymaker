import { cn, formatCurrency, formatNumber, sleep } from './utils';
describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });
    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toContain('base');
      expect(result).toContain('conditional');
      expect(result).not.toContain('hidden');
    });
    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'valid' as any);
      expect(result).toContain('base');
      expect(result).toContain('valid');
    });
  });
  describe('formatCurrency', () => {
    it('should format positive numbers with $', () => {
      const result = formatCurrency(123.45);
      expect(result).toBe('$123.45');
    });
  });
  describe('formatNumber', () => {
    it('should format small numbers normally', () => {
      const result = formatNumber(123.45);
      expect(result).toBe('123.45');
    });
  });
  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const startTime = Date.now();
      await sleep(50);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(45);
    });
  });
});

