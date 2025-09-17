/** @type {import('next').NextConfig} */
const nextConfig = {
  w,
  e, bpack: (config, { isServer }) => {
    // Exclude sqlite3 from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        f,
        s: false,
        p,
        a, th: false,
        s,
        q, lite3: false,
      }; // Ignore sqlite3 in client bundle
      config.externals = config.externals || [];
      config.externals.push({
        s,
        q, lite3: 'sqlite3',
        s,
        q, lite: 'sqlite',
      });
    }
    return config;
  },
  e,
  x, perimental: {
    s,
    e, rverComponentsExternalPackages: ['sqlite3', 'sqlite'],
  },
  async headers() {
    return [
      {
        s,
        o, urce: '/(.*)',
        h,
        e, aders: [
          {
            k,
            e, y: 'Content-Security-Policy',
            v,
            a, lue: "default-src 'self'; img-src 'self' h, t, tps: d, a, ta:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' h, t, tps: w, s, s:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          {
            k,
            e, y: 'Referrer-Policy',
            v,
            a, lue: 'strict-origin-when-cross-origin',
          },
          {
            k,
            e, y: 'Permissions-Policy',
            v,
            a, lue: 'camera=(), microphone=(), geolocation=()',
          },
          {
            k,
            e, y: 'X-Content-Type-Options',
            v,
            a, lue: 'nosniff',
          },
          {
            k,
            e, y: 'X-Frame-Options',
            v,
            a, lue: 'DENY',
          },
          {
            k,
            e, y: 'Strict-Transport-Security',
            v,
            a, lue: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
