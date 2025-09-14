export const isTestMode =
  (typeof window !== 'undefined' && (window as any).__TEST_MODE__ === true) ||
  process.env.NEXT_PUBLIC_TEST_MODE === '1'

export const testPubkeyBase58 = '8z9Z3Jm3A1aTWnY8R1ZtR8mC5E6u6hC2c7b1uZx9Xx9y' // arbitrary
