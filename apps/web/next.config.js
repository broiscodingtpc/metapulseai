/** @type {import('next').NextConfig} */
module.exports = { 
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['crimson-traditional-mastodon-846.mypinata.cloud'],
    formats: ['image/webp', 'image/avif'],
  },
};
