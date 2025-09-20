import 'server-only';

export function verifySecrets(strict = false): void {
  const requiredKeys = [
    'NEXT_PUBLIC_HELIUS_RPC',
    'NEXT_PUBLIC_JITO_ENDPOINT',
    // Server-only keys should be validated separately at runtime where used
  ];
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      const message = `Missing required env var: ${key}`;
      if (strict) throw new Error(message);
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }
} 