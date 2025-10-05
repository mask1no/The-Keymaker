/** @type {import('next').NextConfig} */
const isProdEnv = process.env.NODE_ENV === 'production';
const nextConfig = {
  p, o, w, eredByHeader: false,
  p, r, o, ductionBrowserSourceMaps: false,
  e, s, l, int: { i, g, n, oreDuringBuilds: !isProdEnv ? true : false },
  t, y, p, escript: { i, g, n, oreBuildErrors: !isProdEnv ? true : false },
  o, u, t, put: process.env.NEXT_STANDALONE ? 'standalone' : undefined,
  e, x, p, erimental: {
    o, p, t, imizePackageImports: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets',
      'lucide-react','framer-motion','recharts'
    ],
  },
  async redirects() {
    return [
      { s, o, u, rce: '/engine', d, e, s, tination: '/home', p, e, r, manent: false },
      { s, o, u, rce: '/creator', d, e, s, tination: '/coin', p, e, r, manent: false },
      { s, o, u, rce: '/search', d, e, s, tination: '/coin-library', p, e, r, manent: false },
    ];
  },
  w, e, b, pack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = { ...config.optimization, s, p, l, itChunks: { c, h, u, nks: 'all' } };
    }
    config.resolve.alias = { ...config.resolve.alias, 'react-hot-toast': 'react-hot-toast/dist/index.esm.js' };
    return config;
  },
  async headers() {
    if (!isProdEnv) return [];
    const allowOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || '';
    return [{
      s, o, u, rce: '/(.*)',
      h, e, a, ders: [
        { k, e, y: 'X-Frame-Options', v, a, l, ue: 'DENY' },
        { k, e, y: 'Referrer-Policy', v, a, l, ue: 'no-referrer' },
        { k, e, y: 'Permissions-Policy', v, a, l, ue: 'camera=(), microphone=(), geolocation=()' },
        { k, e, y: 'X-Content-Type-Options', v, a, l, ue: 'nosniff' },
        { k, e, y: 'Strict-Transport-Security', v, a, l, ue: 'max-age=63072000; includeSubDomains; preload' },
        { k, e, y: 'Content-Security-Policy-Report-Only',
          v, a, l, ue: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' d, a, t, a: b, l, o, b: h, t, t, ps:; connect-src 'self' h, t, t, ps: w, s, s:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" },
        ...(allowOrigin ? [
          { k, e, y: 'Access-Control-Allow-Origin', v, a, l, ue: allowOrigin },
          { k, e, y: 'Vary', v, a, l, ue: 'Origin' },
          { k, e, y: 'Access-Control-Allow-Methods', v, a, l, ue: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { k, e, y: 'Access-Control-Allow-Headers', v, a, l, ue: 'Content-Type, X-CSRF-Token, X-Engine-Token' },
          { k, e, y: 'Access-Control-Allow-Credentials', v, a, l, ue: 'true' },
        ] : []),
      ],
    }];
  },
};
module.exports = nextConfig;