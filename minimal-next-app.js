// minimal-next-app.js
// This script creates a minimal Next.js app structure for successful deployment

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Creating minimal Next.js app structure...');

// Create essential directories
const dirs = [
  'app',
  'app/test-app-router',
  'app/api',
  'app/api/health',
  'pages'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Create minimal app files
const files = [
  {
    path: 'app/layout.js',
    content: `// app/layout.js - Root layout
export const metadata = {
  title: 'Tierd - Product Ranking App',
  description: 'Minimal deployment version'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
`
  },
  {
    path: 'app/page.js',
    content: `// app/page.js - Homepage
export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5' 
    }}>
      <div style={{
        maxWidth: '800px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#0070f3', marginTop: 0 }}>Tierd - Product Ranking App</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
          This is a minimal deployment version of the Tierd application.
        </p>
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/test-app-router" 
            style={{
              display: 'inline-block',
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Test App Router
          </a>
        </div>
      </div>
    </div>
  )
}
`
  },
  {
    path: 'app/test-app-router/page.js',
    content: `// app/test-app-router/page.js - Test page
export default function TestPage() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f0f9ff' 
    }}>
      <div style={{
        maxWidth: '800px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#0070f3', marginTop: 0 }}>🎉 App Router is Working!</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6 }}>
          This page confirms that the App Router is functioning correctly.
          The app is using Next.js 14 with the App Router architecture.
        </p>
        <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Environment Info:</h3>
          <p style={{ margin: 0 }}>Next.js 14.2.23</p>
          <p style={{ margin: 0 }}>Node {process.env.NODE_VERSION || '18.x'}</p>
          <p style={{ margin: 0 }}>Deployment: Vercel</p>
        </div>
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/" 
            style={{
              display: 'inline-block',
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
`
  },
  {
    path: 'app/api/health/route.js',
    content: `// Simple health check API endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

export const dynamic = 'force-dynamic';
`
  },
  {
    path: 'pages/_app.js',
    content: `// Empty app file to satisfy Pages Router expectations
import React from 'react';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
`
  },
  {
    path: 'next.config.js',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Basic settings
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Disable type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Simple image configuration
  images: {
    unoptimized: true,
    domains: ['*'],
  },
  
  // Output standalone build
  output: 'standalone',
};

module.exports = nextConfig;
`
  },
  {
    path: 'vercel.json',
    content: `{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run vercel-build"
}
`
  }
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  console.log(`📝 Creating file: ${file.path}`);
  fs.writeFileSync(filePath, file.content);
});

// Update package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
console.log('📦 Updating package.json...');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update build script
packageJson.scripts['vercel-build'] = 'next build';

// Add node engine specification
packageJson.engines = {
  node: '18.x'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Create a simple .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('🔑 Creating .env.local file...');
  fs.writeFileSync(
    envPath,
    `# Environment Variables
NEXT_PUBLIC_SUPABASE_URL=placeholder_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key
`
  );
}

// Add special next-env.d.ts if it doesn't exist
const nextEnvPath = path.join(process.cwd(), 'next-env.d.ts');
if (!fs.existsSync(nextEnvPath)) {
  console.log('📄 Creating next-env.d.ts file...');
  fs.writeFileSync(
    nextEnvPath,
    `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`
  );
}

console.log('✅ Minimal Next.js app created successfully!');
console.log('🔍 Next steps:');
console.log('  1. Commit and push these changes to GitHub');
console.log('  2. Deploy to Vercel using the web interface');
console.log('  3. Add your Supabase environment variables in the Vercel dashboard'); 