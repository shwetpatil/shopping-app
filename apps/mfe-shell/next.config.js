/** @type {import('next').NextConfig} */
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
