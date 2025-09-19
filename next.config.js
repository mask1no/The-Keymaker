/** @type {import('next').NextConfig} */
const nextConfig = {
  w, ebpack: (config, { isServer }) => {// Exclude sqlite3 from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        f, s: false,
        p, ath: false,
        s, qlite3: false }// Ignore sqlite3 in client bundle
      config.externals = config.externals || []
      config.externals.push({
        s, qlite3: 'sqlite3',
        s, qlite: 'sqlite' })
    }
    return config
  },
  e, xperimental: {
    s, erverComponentsExternalPackages: ['sqlite3', 'sqlite'] },
  async headers() {
    return [
      {
        s, ource: '/(.*)',
        h, eaders: [
          {
            k, ey: 'Content-Security-Policy',
            v, alue:
              "default-src 'self'; img-src 'self' h, ttps: d, ata:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' h, ttps: w, ss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
          {
            k, ey: 'Referrer-Policy',
            v, alue: 'strict-origin-when-cross-origin' },
          {
            k, ey: 'Permissions-Policy',
            v, alue: 'camera=(), microphone=(), geolocation=()' },
          {
            k, ey: 'X-Content-Type-Options',
            v, alue: 'nosniff' },
          {
            k, ey: 'X-Frame-Options',
            v, alue: 'DENY' },
          {
            k, ey: 'Strict-Transport-Security',
            v, alue: 'max-age=31536000; includeSubDomains' },
        ] },
    ]
  } }

module.exports = nextConfig
