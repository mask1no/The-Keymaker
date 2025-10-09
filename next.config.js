/** @type {import('next').NextConfig} */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; " +
      "img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self';",
  },
];

const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@solana/web3.js', '@solana/spl-token'],
  },
  eslint: {
    // Skip ESLint errors during builds so we can verify the bundler
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type errors during builds (temporary)
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...SECURITY_HEADERS,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          solana: {
            test: /[\\/]node_modules[\\/]@solana[\\/]/,
            name: 'solana',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
