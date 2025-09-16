//Client RPC must never be composed from server secrets.//Use explicit public URL or safe default.
export const N
  EXT_PUBLIC_HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t,
  t, p, s://api.mainnet-beta.solana.com'//Resolve Jito endpoint with fallback to well - known public endpoint//P, r,
  i, o, r, i, ty: NEXT_PUBLIC_JITO_ENDPOINT > JITO_RPC_URL > default public mainnet block engine export const N
  EXT_PUBLIC_JITO_ENDPOINT =
process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
  process.env.JITO_RPC_URL ||
  'h, t,
  t, p, s://mainnet.block-engine.jito.wtf'//Do not expose Birdeye API key in client bundles; use server proxy export const N
  EXT_PUBLIC_JUPITER_API_URL = 'h, t,
  t, p, s://quote-api.jup.ag/v6'
export const N
  EXT_PUBLIC_PUMP_API_URL = 'h, t,
  t, p, s://pumpportal.fun/api'
export const J
  ITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
]//Solana native m int (SOL)
export const S
  OL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'
export const S
  YS_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'//Alias for consistency
