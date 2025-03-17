// minimal-deploy.js
// This script prepares a minimal Next.js app for deployment to Vercel

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Minimal Deployment Preparation...');

// First, run our minimal-next-app.js script to create a basic working app
try {
  console.log('📦 Creating minimal Next.js app structure...');
  require('./minimal-next-app.js');
} catch (error) {
  console.error('❌ Error creating minimal app:', error.message);
  process.exit(1);
}

// Create deployment instructions
console.log('📝 Creating deployment instructions...');
const deployInstructions = `
# Tierd Minimal Deployment Instructions

## Overview
This is a simplified version of the Tierd application that has been prepared for deployment to Vercel.
It uses Next.js 14 with the App Router architecture and includes only the essential files needed for a successful deployment.

## Deployment Steps

1. **Go to Vercel:**
   - Visit [https://vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository: \`Blazerrzz101/tierd-deployment\`

2. **Configure Settings:**
   - Framework Preset: Next.js
   - Root Directory: \`./\` (default)
   - Build Command: \`npm run vercel-build\`
   - Output Directory: \`.next\` (default)

3. **Environment Variables:**
   Add the following environment variables:
   - \`NEXT_PUBLIC_SUPABASE_URL\`: Your Supabase URL
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Your Supabase anonymous key

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Visit the deployed URL

5. **Testing:**
   - Visit the root URL to see the home page
   - Click "Test App Router" or go to \`/test-app-router\` to verify the App Router is working
   - Visit \`/api/health\` to test the API endpoint

## Troubleshooting

If deployment fails:
1. Check the build logs in the Vercel dashboard
2. Ensure all environment variables are correctly set
3. Verify the branch you're deploying contains the minimal app structure

For any issues, contact the repository maintainer.
`;

fs.writeFileSync('MINIMAL_DEPLOY.md', deployInstructions);

// Create a branch for the minimal deployment
try {
  console.log('📊 Creating a branch for the minimal deployment...');
  
  // Check if the branch already exists
  try {
    execSync('git show-ref --verify --quiet refs/heads/minimal-deployment');
    console.log('Branch minimal-deployment already exists');
  } catch (error) {
    // Branch doesn't exist, create it
    execSync('git checkout -b minimal-deployment');
    console.log('Created new branch: minimal-deployment');
  }
  
  // Commit changes to the minimal-deployment branch
  execSync('git add .');
  execSync('git commit -m "[Cursor] Prepare minimal Next.js app for Vercel deployment"');
  
  // Push the branch to origin
  execSync('git push -u origin minimal-deployment');
  console.log('✅ Pushed minimal-deployment branch to origin');
  
} catch (error) {
  console.error('❌ Error during Git operations:', error.message);
  console.log('Please manually commit and push the changes');
}

console.log(`
✨ Minimal Deployment Preparation Complete ✨

A simplified version of the Tierd application has been created and pushed to the 'minimal-deployment' branch.

Next steps:
1. Go to Vercel: https://vercel.com/new
2. Import your GitHub repository
3. Select the 'minimal-deployment' branch
4. Add your Supabase environment variables
5. Deploy the application

For detailed instructions, see the MINIMAL_DEPLOY.md file.
`); 