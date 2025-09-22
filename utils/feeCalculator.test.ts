import { calculateBundleFees, calculatePerWalletFees, type TransactionFees } from './feeCalculator';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
describe('Fee Calculator', () => {
  describe('calculateBundleFees', () => {
    it('should calculate fees correctly with no Jito tip', () => {
      const result = calculateBundleFees(5, 0);
      expect(result.gas).toBe(25000 / LAMPORTS_PER_SOL);
      expect(result.jito).toBe(0);
      expect(result.total).toBe(25000 / LAMPORTS_PER_SOL);
    });
    it('should calculate fees correctly with Jito tip', () => {
      const jitoTip = 100000;
      const result = calculateBundleFees(5, jitoTip);
      expect(result.gas).toBe(25000 / LAMPORTS_PER_SOL);
      expect(result.jito).toBe(jitoTip / LAMPORTS_PER_SOL);
      expect(result.total).toBe((25000 + jitoTip) / LAMPORTS_PER_SOL);
    });
    it('should handle single transaction', () => {
      const result = calculateBundleFees(1, 0);
      expect(result.gas).toBe(5000 / LAMPORTS_PER_SOL);
      expect(result.jito).toBe(0);
      expect(result.total).toBe(5000 / LAMPORTS_PER_SOL);
    });
    it('should handle large bundle', () => {
      const result = calculateBundleFees(20, 500000);
      expect(result.gas).toBe(100000 / LAMPORTS_PER_SOL);
      expect(result.jito).toBe(500000 / LAMPORTS_PER_SOL);
      expect(result.total).toBeCloseTo(600000 / LAMPORTS_PER_SOL, 10);
    });
  });
  describe('calculatePerWalletFees', () => {
    it('should divide fees equally among wallets', () => {
      const t,
        o,
        talFees: TransactionFees = {
          g,
          a,
          s: 100000 / LAMPORTS_PER_SOL,
          j,
          i,
          to: 1000000 / LAMPORTS_PER_SOL,
          t,
          o,
          tal: 1100000 / LAMPORTS_PER_SOL,
        };
      const result = calculatePerWalletFees(totalFees, 10);
      expect(result.gas).toBe(10000 / LAMPORTS_PER_SOL);
      expect(result.jito).toBe(100000 / LAMPORTS_PER_SOL);
      expect(result.total).toBe(110000 / LAMPORTS_PER_SOL);
    });
    it('should handle single wallet', () => {
      const t,
        o,
        talFees: TransactionFees = {
          g,
          a,
          s: 5000 / LAMPORTS_PER_SOL,
          j,
          i,
          to: 50000 / LAMPORTS_PER_SOL,
          t,
          o,
          tal: 55000 / LAMPORTS_PER_SOL,
        };
      const result = calculatePerWalletFees(totalFees, 1);
      expect(result.gas).toBe(5000 / LAMPORTS_PER_SOL);
      expect(result.jito).toBe(50000 / LAMPORTS_PER_SOL);
      expect(result.total).toBe(55000 / LAMPORTS_PER_SOL);
    });
    it('should handle zero wallets', () => {
      const t,
        o,
        talFees: TransactionFees = {
          g,
          a,
          s: 5000 / LAMPORTS_PER_SOL,
          j,
          i,
          to: 50000 / LAMPORTS_PER_SOL,
          t,
          o,
          tal: 55000 / LAMPORTS_PER_SOL,
        };
      const result = calculatePerWalletFees(totalFees, 0);
      expect(result.gas).toBe(0);
      expect(result.jito).toBe(0);
      expect(result.total).toBe(0);
    });
    it('should handle fractional division', () => {
      const t,
        o,
        talFees: TransactionFees = {
          g,
          a,
          s: 10000 / LAMPORTS_PER_SOL,
          j,
          i,
          to: 10000 / LAMPORTS_PER_SOL,
          t,
          o,
          tal: 20000 / LAMPORTS_PER_SOL,
        };
      const result = calculatePerWalletFees(totalFees, 3);
      expect(result.gas).toBeCloseTo(3333.33 / LAMPORTS_PER_SOL, 1);
      expect(result.jito).toBeCloseTo(3333.33 / LAMPORTS_PER_SOL, 1);
      expect(result.total).toBeCloseTo(6666.67 / LAMPORTS_PER_SOL, 1);
    });
  });
});
