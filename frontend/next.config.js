/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? 'https://vacas-backend.onrender.com'
      : 'http://localhost:8000',
  },
  output: 'standalone',
};

module.exports = nextConfig;
