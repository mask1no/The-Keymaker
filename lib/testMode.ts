export function isTestMode(): boolean {
  try {
    if (typeof window !== 'undefined') {
      return (
        (window as any).__TEST_MODE__ === true ||
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TEST_MODE === '1')
      );
    }
    return (
      typeof process !== 'undefined' &&
      (process.env?.TEST_MODE === '1' || process.env?.NEXT_PUBLIC_TEST_MODE === '1')
    );
  } catch {
    return false;
  }
}
export const testPubkeyBase58 = '8z9Z3Jm3A1aTWnY8R1ZtR8mC5E6u6hC2c7b1uZx9Xx9y';

