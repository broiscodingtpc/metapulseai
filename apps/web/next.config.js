/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['crimson-traditional-mastodon-846.mypinata.cloud'],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
