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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

module.exports = nextConfig;
