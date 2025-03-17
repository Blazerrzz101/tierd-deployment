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
  
  // Explicitly use App Router only
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['next', 'react', 'react-dom'],
  },
  
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
    domains: ['*'],
  },
  
  // Ensure we're only using app directory routing
  useFileSystemPublicRoutes: true,
  
  // Override to ensure compatibility
  webpack(config) {
    return config;
  }
};

module.exports = nextConfig;