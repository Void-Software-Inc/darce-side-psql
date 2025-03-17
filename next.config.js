/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure server-only modules
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  webpack: (config) => {
    // Ignore pg-native module
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};
    config.resolve.fallback['pg-native'] = false;
    
    return config;
  },
  images: {
    domains: ['cdn.shopify.com'],
  },
};

module.exports = nextConfig; 