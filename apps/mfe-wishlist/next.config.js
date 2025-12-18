/** @type {import('next').NextConfig} */

// Import centralized port configuration
const { SERVICE_PORTS, MFE_PORTS } = (() => {
  try {
    require('tsx/cjs');
    return require('../../config/ports.ts');
  } catch {
    return { SERVICE_PORTS: {}, MFE_PORTS: { WISHLIST: 3002 } };
  }
})();

// Log startup information
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || MFE_PORTS.WISHLIST;
  console.log(`\n❤️ MFE Wishlist starting on port ${port}`);
  console.log(`   URL: http://localhost:${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV}\n`);
}

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.publicPath = 'auto';
    }
    return config;
  },
};

module.exports = nextConfig;
