/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_STANDALONE ? 'standalone' : undefined,
  eslint: {
    // Skip lint errors during build to allow bundler path to compile
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Enforce type correctness in builds
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
};

module.exports = nextConfig;
