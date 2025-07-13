/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_HELIUS_RPC: process.env.NEXT_PUBLIC_HELIUS_RPC,
    NEXT_PUBLIC_JITO_ENDPOINT: process.env.NEXT_PUBLIC_JITO_ENDPOINT,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(baseConfig, {
  org: '3d49c0f8b7f8',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,
});
