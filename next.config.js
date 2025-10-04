/** @type {import('next').NextConfig} */
const isProdEnv = process.env.NODE_ENV === 'production';
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: !isProdEnv ? true : false },
  typescript: { ignoreBuildErrors: !isProdEnv ? true : false },
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
    const allowOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || '';
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
        ...(allowOrigin ? [
          { key: 'Access-Control-Allow-Origin', value: allowOrigin },
          { key: 'Vary', value: 'Origin' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-CSRF-Token, X-Engine-Token' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ] : []),
      ],
    }];
  },
};
module.exports = nextConfig;