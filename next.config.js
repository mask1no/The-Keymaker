/** @type {import('next').NextConfig} */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value:
      // Loosened to allow Next.js hydration and client-side interactions
      "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; " +
      "img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; " +
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; " +
      "connect-src 'self' https: chrome-extension: moz-extension: ms-browser-extension:; " +
      "font-src 'self' data:; worker-src 'self' blob:;",
  },
];

const isAnalyze = process.env.ANALYZE === 'true';

const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  eslint: {
    // Enforce ESLint during builds
    ignoreDuringBuilds: isAnalyze ? true : false,
  },
  typescript: {
    // Enforce TypeScript type errors during builds
    ignoreBuildErrors: isAnalyze ? true : false,
  },
  output: process.env.NEXT_STANDALONE ? 'standalone' : undefined,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};
// Enable bundle analyzer when ANALYZE=true
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
