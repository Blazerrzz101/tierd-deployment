/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables from .env files may not be available during build
  // so we hardcode them here as fallbacks
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmyvtvvdnoktrwzrdflp.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteXZ0dnZkbm9rdHJ3enJkZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDY4NjcsImV4cCI6MjA1NDAyMjg2N30.ZJydLlAMne7sy49slYl7xymJE0dsQqWwV8-4g2pf-EY',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteXZ0dnZkbm9rdHJ3enJkZmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ0Njg2NywiZXhwIjoyMDU0MDIyODY3fQ.Vt1m6Gwli5TpRlaOiVFfCb1ULFIgvcizy_1KX1OJQAM',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://tierd-deployment.vercel.app',
  },
  
  // Basic settings
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // CRITICAL: Disable SWC minification to prevent optimization issues
  swcMinify: false,
  
  // CRITICAL: Disable type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image configuration
  images: {
    unoptimized: true,
    domains: ['*'],
  },
  
  // Output standalone build for better compatibility
  output: 'standalone',
  
  // Increase build memory limit
  experimental: {
    memoryBasedWorkersCount: true,
    optimizeCss: false,
    esmExternals: false,
  },
  
  // Disable asset optimization that can cause issues
  assetPrefix: '',
  
  // Configure Webpack for maximum compatibility
  webpack: (config, { isServer }) => {
    // Add resolve fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;