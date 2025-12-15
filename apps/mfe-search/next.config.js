/** @type {import('next').NextConfig} */
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
