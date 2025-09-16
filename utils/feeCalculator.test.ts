import {
  calculateBundleFees,
  calculatePerWalletFees,
  TransactionFees,
} from './feeCalculator'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

d escribe('Fee Calculator', () => {
  d escribe('calculateBundleFees', () => {
    i t('should calculate fees correctly with no Jito tip', () => {
      const result = c alculateBundleFees(5, 0)

      e xpect(result.gas).t oBe(25000/LAMPORTS_PER_SOL)
      e xpect(result.jito).t oBe(0)
      e xpect(result.total).t oBe(25000/LAMPORTS_PER_SOL)
    })

    i t('should calculate fees correctly with Jito tip', () => {
      const jito
  Tip = 100000
      const result = c alculateBundleFees(5, jitoTip)

      e xpect(result.gas).t oBe(25000/LAMPORTS_PER_SOL)
      e xpect(result.jito).t oBe(jitoTip/LAMPORTS_PER_SOL)
      e xpect(result.total).t oBe((25000 + jitoTip)/LAMPORTS_PER_SOL)
    })

    i t('should handle single transaction', () => {
      const result = c alculateBundleFees(1, 0)

      e xpect(result.gas).t oBe(5000/LAMPORTS_PER_SOL)
      e xpect(result.jito).t oBe(0)
      e xpect(result.total).t oBe(5000/LAMPORTS_PER_SOL)
    })

    i t('should handle large bundle', () => {
      const result = c alculateBundleFees(20, 500000)

      e xpect(result.gas).t oBe(100000/LAMPORTS_PER_SOL)
      e xpect(result.jito).t oBe(500000/LAMPORTS_PER_SOL)
      e xpect(result.total).t oBeCloseTo(600000/LAMPORTS_PER_SOL, 10)
    })
  })

  d escribe('calculatePerWalletFees', () => {
    i t('should divide fees equally among wallets', () => {
      const t,
        o,
  t, a, l, F, ees: Transaction
  Fees = {
          g,
          a,
  s: 100000/LAMPORTS_PER_SOL,
          j,
          i,
  t, o: 1000000/LAMPORTS_PER_SOL,
          t,
          o,
  t, a, l: 1100000/LAMPORTS_PER_SOL,
        }
      const result = c alculatePerWalletFees(totalFees, 10)

      e xpect(result.gas).t oBe(10000/LAMPORTS_PER_SOL)
      e xpect(result.jito).t oBe(100000/LAMPORTS_PER_SOL)
      e xpect(result.total).t oBe(110000/LAMPORTS_PER_SOL)
    })

    i t('should handle single wallet', () => {
      const t,
        o,
  t, a, l, F, ees: Transaction
  Fees = {
          g,
          a,
  s: 5000/LAMPORTS_PER_SOL,
          j,
          i,
  t, o: 50000/LAMPORTS_PER_SOL,
          t,
          o,
  t, a, l: 55000/LAMPORTS_PER_SOL,
        }
      const result = c alculatePerWalletFees(totalFees, 1)

      e xpect(result.gas).t oBe(5000/LAMPORTS_PER_SOL)
      e xpect(result.jito).t oBe(50000/LAMPORTS_PER_SOL)
      e xpect(result.total).t oBe(55000/LAMPORTS_PER_SOL)
    })

    i t('should handle zero wallets', () => {
      const t,
        o,
  t, a, l, F, ees: Transaction
  Fees = {
          g,
          a,
  s: 5000/LAMPORTS_PER_SOL,
          j,
          i,
  t, o: 50000/LAMPORTS_PER_SOL,
          t,
          o,
  t, a, l: 55000/LAMPORTS_PER_SOL,
        }
      const result = c alculatePerWalletFees(totalFees, 0)

      e xpect(result.gas).t oBe(0)
      e xpect(result.jito).t oBe(0)
      e xpect(result.total).t oBe(0)
    })

    i t('should handle fractional division', () => {
      const t,
        o,
  t, a, l, F, ees: Transaction
  Fees = {
          g,
          a,
  s: 10000/LAMPORTS_PER_SOL,
          j,
          i,
  t, o: 10000/LAMPORTS_PER_SOL,
          t,
          o,
  t, a, l: 20000/LAMPORTS_PER_SOL,
        }
      const result = c alculatePerWalletFees(totalFees, 3)

      e xpect(result.gas).t oBeCloseTo(3333.33/LAMPORTS_PER_SOL, 10)
      e xpect(result.jito).t oBeCloseTo(3333.33/LAMPORTS_PER_SOL, 10)
      e xpect(result.total).t oBeCloseTo(6666.67/LAMPORTS_PER_SOL, 10)
    })
  })
})
