import { selectTipLamports, getTipTier, estimateBundleCost } from '@/lib/core/src/tipCalculator';

describe('Tip Calculator', () => {
  describe('selectTipLamports', () => {
    it('should calculate tip as 110% of p50', () => {
      const floor = { p25: 25_000, p50: 50_000, p75: 100_000 };
      const tip = selectTipLamports(floor);

      // 50_000 * 1.1 = 55_000 (or 55_001 due to ceil)
      expect(tip).toBeGreaterThanOrEqual(55_000);
      expect(tip).toBeLessThanOrEqual(55_001);
    });

    it('should clamp to minimum', () => {
      const floor = { p25: 1_000, p50: 5_000, p75: 10_000 };
      const tip = selectTipLamports(floor, 20_000, 100_000);

      // 5_000 * 1.1 = 5_500, but min is 20_000
      expect(tip).toBe(20_000);
    });

    it('should clamp to maximum', () => {
      const floor = { p25: 500_000, p50: 1_000_000, p75: 2_000_000 };
      const tip = selectTipLamports(floor, 10_000, 500_000);

      // 1_000_000 * 1.1 = 1_100_000, but max is 500_000
      expect(tip).toBe(500_000);
    });

    it('should handle zero floor gracefully', () => {
      const floor = { p25: 0, p50: 0, p75: 0 };
      const tip = selectTipLamports(floor, 10_000, 100_000);

      expect(tip).toBeGreaterThanOrEqual(10_000);
    });
  });

  describe('getTipTier', () => {
    it('should classify low tier', () => {
      expect(getTipTier(10_000)).toBe('low');
      expect(getTipTier(24_999)).toBe('low');
    });

    it('should classify medium tier', () => {
      expect(getTipTier(25_000)).toBe('medium');
      expect(getTipTier(99_999)).toBe('medium');
    });

    it('should classify high tier', () => {
      expect(getTipTier(100_000)).toBe('high');
      expect(getTipTier(499_999)).toBe('high');
    });

    it('should classify ultra tier', () => {
      expect(getTipTier(500_000)).toBe('ultra');
      expect(getTipTier(1_000_000)).toBe('ultra');
    });
  });

  describe('estimateBundleCost', () => {
    it('should calculate total cost correctly', () => {
      const cost = estimateBundleCost({
        t,
        i,
        p,
        Lamports: 50_000,
        n,
        u,
        m,
        Transactions: 5,
        a,
        v,
        g,
        ComputeUnits: 200_000,
      });

      expect(cost.tipCost).toBe(50_000);
      expect(cost.computeCost).toBe(25_000); // 5_000 * 5
      expect(cost.total).toBe(75_000);
    });

    it('should handle custom compute units', () => {
      const cost = estimateBundleCost({
        t,
        i,
        p,
        Lamports: 100_000,
        n,
        u,
        m,
        Transactions: 3,
        a,
        v,
        g,
        ComputeUnits: 400_000,
      });

      expect(cost.computeCost).toBe(30_000); // (400k/200k) * 5000 * 3
    });
  });
});
