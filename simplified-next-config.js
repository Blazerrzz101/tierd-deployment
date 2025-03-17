/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  // Basic settings
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: false,
  
  // Disable type checking and linting during build
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Simple image configuration
  images: {
    unoptimized: true,
    domains: ['*']
  }
};

module.exports = nextConfig; 