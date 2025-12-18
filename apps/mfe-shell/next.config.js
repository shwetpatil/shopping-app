/** @type {import('next').NextConfig} */

// Import centralized port configuration
const { SERVICE_PORTS, MFE_PORTS } = (() => {
  try {
    require('tsx/cjs');
    return require('../../config/ports.ts');
  } catch {
    return { SERVICE_PORTS: {}, MFE_PORTS: { SHELL: 3000 } };
  }
})();

// Log startup information
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || MFE_PORTS.SHELL;
  console.log(`\n🏠 MFE Shell starting on port ${port}`);
  console.log(`   URL: http://localhost:${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV}\n`);
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  experimental: {
    // Enable when Module Federation is stable for Next.js 14+
    // Or use alternative federation approach
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side webpack config for loading remote modules
      config.output.publicPath = 'auto';
      
      // Module Federation will be configured here
      // Using @module-federation/nextjs-mf or alternative
    }
    
    return config;
  },
};

module.exports = nextConfig;
