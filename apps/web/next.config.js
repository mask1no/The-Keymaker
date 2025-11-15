/** @type {import('next').NextConfig} */
// Derive HTTP base from the configured WS URL so pages can fetch daemon HTTP endpoints
const WS = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8787';
const HTTP_FROM_WS = WS ? WS.replace(/^wss?:\/\//, (m) => (m === 'wss://' ? 'https://' : 'http://')) : 'http://localhost:8787';
const DEFAULT_WS = 'ws://localhost:8787';
const DEFAULT_HTTP = 'http://localhost:8787';

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@keymaker/types'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
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
            `connect-src 'self' ${WS || DEFAULT_WS} ${HTTP_FROM_WS || DEFAULT_HTTP}`.trim(),
          ].join('; ') }
        ]
      }
    ];
  }
};
module.exports = nextConfig;


