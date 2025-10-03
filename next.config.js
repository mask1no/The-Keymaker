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
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      'lucide-react',
      'framer-motion',
      'recharts',
      'react-grid-layout',
      'react-hook-form',
      'react-hot-toast',
      'react-hotkeys-hook',
      'react-markdown'
    ],
  },
  async redirects() {
    return [
      { source: '/creator', destination: '/coin', permanent: false },
      { source: '/search', destination: '/coin-library', permanent: false },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 50000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
      config.performance = { maxAssetSize: 45000, maxEntrypointSize: 45000, hints: 'warning' };
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
        'playwright': 'commonjs playwright',
        'fs': 'commonjs fs',
        'path': 'commonjs path',
        'crypto': 'commonjs crypto',
        '@sentry/node': 'commonjs @sentry/node',
        'prom-client': 'commonjs prom-client',
      });
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
        { key: 'Content-Security-Policy', value:
          "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
      ],
    }];
  },
};

module.exports = nextConfig;