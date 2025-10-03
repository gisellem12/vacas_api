import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://vacasapi-production.up.railway.app' 
      : 'http://localhost:8000',
  },
};

export default nextConfig;
