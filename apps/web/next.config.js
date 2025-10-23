/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: true,
  images: {
    unoptimized: false, // Enable image optimization
    domains: ['crimson-traditional-mastodon-846.mypinata.cloud', 'ipfs.io', 'gateway.pinata.cloud'],
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Compiler options for better performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
