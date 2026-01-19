import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Output standalone server to bypass Next.js 16 static pre-rendering bug
  output: 'standalone',

  // Include modules that Next.js standalone doesn't automatically trace
  outputFileTracingIncludes: {
    '/api/verify': ['./node_modules/tiny-secp256k1/**/*'],
    '/api/verify/dns-check': ['./node_modules/tiny-secp256k1/**/*'],
    // pg is used by server-wrapper.js for migrations
    '/*': ['./node_modules/pg/**/*', './node_modules/pg-pool/**/*', './node_modules/pg-protocol/**/*'],
  },

  // Transpile workspace packages and CommonJS dependencies
  transpilePackages: ['@atlasp2p/config', '@atlasp2p/types', 'bitcoinjs-message'],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
