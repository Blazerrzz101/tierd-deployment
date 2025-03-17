// force-rebuild.js
// This script runs as part of the deployment process to ensure compatibility with Vercel and App Router

const fs = require('fs');
const path = require('path');

console.log('🔄 Running force-rebuild script to ensure App Router compatibility...');

// Step 1: Create a minimal .env file if it doesn't exist
if (!fs.existsSync('.env')) {
  console.log('📝 Creating minimal .env file...');
  fs.writeFileSync('.env', `
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}
NEXT_PUBLIC_APP_URL=${process.env.NEXT_PUBLIC_APP_URL || ''}
  `.trim());
}

// Step 2: Ensure we have an empty pages directory to avoid conflicts
const pagesDir = path.join(process.cwd(), 'pages');
if (!fs.existsSync(pagesDir)) {
  console.log('📁 Creating empty pages directory to indicate we\'re not using Pages Router...');
  fs.mkdirSync(pagesDir);
  // Create an empty _app.js file to avoid Next.js warnings
  fs.writeFileSync(path.join(pagesDir, '_app.js'), '// This file exists to prevent Pages Router warnings\nexport default function App({ Component, pageProps }) { return <Component {...pageProps} />; }\n');
}

// Step 3: Check if we need to modify the next.config.js file
try {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (!nextConfigContent.includes('appDir: true')) {
    console.log('⚙️ Updating next.config.js to explicitly enable App Router...');
    nextConfigContent = nextConfigContent.replace(
      'const nextConfig = {',
      `const nextConfig = {
  experimental: {
    appDir: true,
  },`
    );
    fs.writeFileSync(nextConfigPath, nextConfigContent);
  }
} catch (error) {
  console.error('❌ Error updating next.config.js:', error);
}

console.log('✅ Force rebuild script completed successfully!'); 