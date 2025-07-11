const { withSentryConfig } = require('@sentry/nextjs');
module.exports = withSentryConfig({
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_HELIUS_RPC: process.env.NEXT_PUBLIC_HELIUS_RPC,
    NEXT_PUBLIC_JITO_ENDPOINT: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
}); 