/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'accelerometer=(), camera=(), microphone=(), geolocation=()' },
          // CSP: disallow inline scripts/styles, restrict connections to same-origin + configured WS
          { key: 'Content-Security-Policy', value: [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "img-src 'self' data:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self'",
            `connect-src 'self' ${process.env.NEXT_PUBLIC_WS_URL || ''}`.trim(),
          ].join('; ') }
        ]
      }
    ];
  }
};
module.exports = nextConfig;


