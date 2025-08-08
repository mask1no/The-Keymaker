/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
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
      }

      // Ignore native modules
      config.externals.push({
        sqlite3: 'commonjs sqlite3',
        sqlite: 'commonjs sqlite',
        // Puppeteer-only node modules shouldn't be bundled client-side
        dns: 'commonjs dns',
        module: 'commonjs module',
        'child_process': 'commonjs child_process',
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
  },
}

module.exports = nextConfig
