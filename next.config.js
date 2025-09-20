/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip lint errors during build to allow bundler path to compile
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Build will fail on type errors in included files
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Exclude sqlite3 from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        sqlite3: false,
      };
      config.externals = config.externals || [];
      config.externals.push({ sqlite3: 'sqlite3', sqlite: 'sqlite' });
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['sqlite3', 'sqlite'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
