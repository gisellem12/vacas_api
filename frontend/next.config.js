/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://vacas-backend.onrender.com'
      : 'http://localhost:8000',
  },
};

module.exports = nextConfig;
