/** @type {import('next').NextConfig} */

// Import centralized port configuration
const { SERVICE_PORTS, MFE_PORTS } = (() => {
  try {
    // Try loading from tsx
    require('tsx/cjs');
    return require('../../config/ports.ts');
  } catch {
    // Fallback to direct values if import fails
    return {
      SERVICE_PORTS: { API_GATEWAY: 4000, PRODUCT: 4002, CART: 4006 },
      MFE_PORTS: { PRODUCTS: 3004 }
    };
  }
})();

// Log startup information
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || MFE_PORTS.PRODUCTS;
  console.log(`\n📦 MFE Products starting on port ${port}`);
  console.log(`   URL: http://localhost:${port}`);
  console.log(`   API: http://localhost:${SERVICE_PORTS.PRODUCT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}\n`);
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'product-images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: new RegExp(`^http:\\/\\/localhost:${SERVICE_PORTS.PRODUCT}\\/api\\/products.*`, 'i'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'product-api',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.publicPath = 'auto';
    }
    return config;
  },
  
  // Configuration files are in the config/ directory
  experimental: {},
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://images.unsplash.com data: blob:",
              "font-src 'self' data:",
              `connect-src 'self' http://localhost:${SERVICE_PORTS.API_GATEWAY} http://localhost:${SERVICE_PORTS.PRODUCT} http://localhost:${SERVICE_PORTS.CART}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
