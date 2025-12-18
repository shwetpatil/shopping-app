/** @type {import('next').NextConfig} */

// Import centralized port configuration
const { SERVICE_PORTS, MFE_PORTS } = (() => {
  try {
    require('tsx/cjs');
    return require('../../config/ports.ts');
  } catch {
    return { SERVICE_PORTS: {}, MFE_PORTS: { SEARCH: 3001 } };
  }
})();

// Log startup information
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || MFE_PORTS.SEARCH;
  console.log(`\n🔍 MFE Search starting on port ${port}`);
  console.log(`   URL: http://localhost:${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV}\n`);
}

const nextConfig = {
  reactStrictMode: true,
  // Module Federation configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.publicPath = 'auto';
    }
    return config;
  },
  // Expose components for remote consumption
  experimental: {
    // Will add Module Federation plugin here
  },
};

module.exports = nextConfig;
