// vercel-deploy.js
// This script provides a direct way to deploy to Vercel via browser

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Vercel Browser Deployment Helper ===');

// 1. Ensure we have a clean vercel.json
console.log('Creating minimal vercel.json...');
const vercelConfig = {
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run vercel-build"
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));

// 2. Create a deployment instructions file
console.log('Creating deployment instructions...');
const deployInstructions = `
# Vercel Deployment Instructions

Follow these steps to deploy the project:

1. Go to the [Vercel Import page](https://vercel.com/import)
2. Select "Import Git Repository"
3. Choose the GitHub repository: \`Blazerrzz101/tierd-deployment\`
4. Use these settings:
   - Framework Preset: Next.js
   - Build Command: \`npm run vercel-build\`
   - Install Command: \`npm install\`
   - Output Directory: \`.next\`

5. Add the following environment variables:
   - \`NEXT_PUBLIC_SUPABASE_URL\`: Your Supabase URL
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Your Supabase anonymous key
   - \`FORCE_CLEAN_START\`: true

6. Click "Deploy"

After deployment, visit \`/test-app-router\` to confirm the App Router is working.
`;

fs.writeFileSync('VERCEL_DEPLOY.md', deployInstructions);

// 3. Create a test package.json specifically for Vercel
console.log('Creating Vercel-specific package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update the vercel-build script
packageJson.scripts['vercel-build'] = 'node app-router-fix.js && npm run build';

// Add Vercel-specific settings
packageJson.engines = {
  node: '18.x'
};

// Save the updated package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// 4. Commit changes
try {
  console.log('Committing changes...');
  execSync('git add vercel.json VERCEL_DEPLOY.md package.json');
  execSync('git commit -m "[Cursor] Prepare for Vercel browser deployment"');
  execSync('git push');
  console.log('Changes committed and pushed!');
} catch (error) {
  console.error('Error committing changes:', error.message);
}

console.log(`
=== Deployment Preparation Complete ===

1. Push your code to GitHub if not already done
2. Follow the instructions in VERCEL_DEPLOY.md to deploy via the Vercel web interface
3. After deploying, check /test-app-router to verify the App Router is working

For additional troubleshooting, check the Vercel build logs in the web interface.
`); 