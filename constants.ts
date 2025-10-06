// Client RPC must never include secret keys; prefer read-only public endpoints
export const NEXT_PUBLIC_HELIUS_RPC = (process.env.NEXT_PUBLIC_HELIUS_RPC || '').startsWith('http')
  ? (process.env.NEXT_PUBLIC_HELIUS_RPC as string)
  : 'https://api.mainnet-beta.solana.com';
// Priority: NEXT_PUBLIC_JITO_ENDPOINT (if any) should be a public endpoint only; server uses private block engine
export const NEXT_PUBLIC_JITO_ENDPOINT =
  process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'https://mainnet.block-engine.jito.wtf';
export const NEXT_PUBLIC_JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
export const NEXT_PUBLIC_PUMP_API_URL = 'https://pumpportal.fun/api';
export const JITO_TIP_ACCOUNTS = [
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
]; // Solana native mint (SOL)
export const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';
export const SYS_MINT_ADDRESS = SOL_MINT_ADDRESS; // Alias for consistency
