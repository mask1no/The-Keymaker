/* eslint-disable import/no-commonjs */
/** @type {import('next').NextConfig} */
const isProdEnv = process.env.NODE_ENV === 'production';
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: process.env.NEXT_STANDALONE ? 'standalone' : undefined,
  experimental: {
    optimizePackageImports: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets',
      'lucide-react','framer-motion','recharts'
    ],
  },
  async redirects() {
    return [
      { source: '/engine', destination: '/home', permanent: false },
      { source: '/creator', destination: '/coin', permanent: false },
      { source: '/search', destination: '/coin-library', permanent: false },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = { ...config.optimization, splitChunks: { chunks: 'all' } };
    }
    config.resolve.alias = { ...config.resolve.alias, 'react-hot-toast': 'react-hot-toast/dist/index.esm.js' };
    return config;
  },
  async headers() {
    if (!isProdEnv) return [];
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" },
      ],
    }];
  },
};
module.exports = nextConfig;