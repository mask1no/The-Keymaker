/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default output locally to avoid Windows symlink EPERM issues
  // output: 'standalone',
  reactStrictMode: true,
  output: process.env.NEXT_STANDALONE ? 'standalone' : undefined,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Ignore specific warnings
    config.ignoreWarnings = [{ module: /node_modules\/punycode/ }]

    // Don't bundle server-side modules for the browser
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        dns: false,
        module: false,
        http: false,
        https: false,
        assert: false,
        child_process: false,
      }

      // Ignore native modules
      config.externals.push({
        sqlite3: 'commonjs sqlite3',
        sqlite: 'commonjs sqlite',
        // Puppeteer-only node modules shouldn't be bundled client-side
        dns: 'commonjs dns',
        module: 'commonjs module',
        child_process: 'commonjs child_process',
        http: 'commonjs http',
        https: 'commonjs https',
        assert: 'commonjs assert',
        fs: 'commonjs fs',
      })
    }

    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['sqlite3', 'sqlite'],
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
