/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude sqlite3 from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        sqlite3: false,
      }

      // Ignore sqlite3 in client bundle
      config.externals = config.externals || []
      config.externals.push({
        'sqlite3': 'sqlite3',
        'sqlite': 'sqlite'
      })
    }

    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['sqlite3', 'sqlite']
  }
}

module.exports = nextConfig
