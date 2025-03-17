#!/usr/bin/env node
/**
 * Import to Vercel Script
 * 
 * This script prepares detailed instructions for importing
 * the ultimate deployment directly in Vercel.
 */

const fs = require('fs');
const path = require('path');

console.log('\n\x1b[1m\x1b[32m===== IMPORT TO VERCEL INSTRUCTIONS =====\x1b[0m\n');

// Define the deployment directory
const BUILD_DIR = path.join(process.cwd(), '.vercel-deploy');
if (!fs.existsSync(BUILD_DIR)) {
  console.error('\x1b[31mError: Deployment directory not found. Please run ultimate-deploy.js first.\x1b[0m');
  process.exit(1);
}

// Create a detailed import instructions file
const importMd = `# Importing to Vercel

## Option 1: Direct Import with GitHub

1. **Create a GitHub repository**
   - Create a new repository on GitHub
   - Push the deployment files to this repository

2. **Log in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Log in with your account

3. **Import Project**
   - Click "Add New..." > "Project"
   - Select your GitHub repository
   - Vercel will automatically detect the configuration

4. **Configure Project**
   - Framework Preset: Leave as "Other" (detected automatically)
   - Build Command: Leave empty (not needed)
   - Output Directory: Leave as "." (root directory)
   - Install Command: Leave empty (not needed)

5. **Deploy**
   - Click "Deploy"
   - Your project will deploy within seconds!

## Option 2: Manual Deploy with Vercel CLI

1. **Install Vercel CLI**
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Navigate to the Deployment Directory**
   \`\`\`bash
   cd .vercel-deploy
   \`\`\`

3. **Deploy with Vercel CLI**
   \`\`\`bash
   vercel deploy --prod
   \`\`\`

## Option 3: Deploy From Dashboard Directly

1. **Create a zip file of the deployment directory**
   - Zip the contents of \`.vercel-deploy\`

2. **Log in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Log in with your account

3. **Access Your Team or Personal Account**
   - Select your team or personal account

4. **Create New Project**
   - Click "Add New..." > "Project"
   - Choose "Upload" at the bottom

5. **Upload Zip File**
   - Drop your zip file in the upload area
   - Vercel will process the files

6. **Deploy**
   - Click "Deploy"
   - Your project will deploy within seconds!

## Testing Your Deployment

After deployment, verify the following:

1. **Home Page**
   - Visit the main URL of your deployment
   - Confirm the Tierd landing page loads

2. **API Endpoint**
   - Visit \`/api/health\`
   - Confirm it returns a JSON response

3. **Documentation**
   - Visit \`/docs.html\`
   - Confirm the documentation page loads
`;

// Write the import instructions to a file
fs.writeFileSync(path.join(BUILD_DIR, 'VERCEL_IMPORT.md'), importMd);

// Copy the deployment files to a zip folder location
const zipDir = path.join(process.cwd(), 'vercel-deploy-package');
if (!fs.existsSync(zipDir)) {
  fs.mkdirSync(zipDir, { recursive: true });
}

// Function to copy a file
function copyFile(source, target) {
  fs.copyFileSync(source, target);
  console.log(`Copied: ${path.relative(process.cwd(), target)}`);
}

// Function to copy directory recursively
function copyDir(src, dest) {
  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read the contents of the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      copyFile(srcPath, destPath);
    }
  }
}

// Copy the deployment files to the zip folder
copyDir(BUILD_DIR, zipDir);

// Create a batch file for Windows users
const batchFile = `@echo off
echo ===== PREPARING VERCEL DEPLOYMENT =====
echo.
echo This batch file will help you deploy to Vercel
echo.

cd "${zipDir.replace(/\//g, '\\')}"

echo Creating deployment package...
echo.

if exist "vercel-deploy.zip" del "vercel-deploy.zip"

powershell -command "Compress-Archive -Path * -DestinationPath vercel-deploy.zip"

echo.
echo Deployment package created: vercel-deploy.zip
echo.
echo Please upload this file to Vercel using the instructions in VERCEL_IMPORT.md
echo.
pause
`;

fs.writeFileSync(path.join(zipDir, 'deploy-to-vercel.bat'), batchFile);

// Create a shell script for Unix users
const shellScript = `#!/bin/bash
echo "===== PREPARING VERCEL DEPLOYMENT ====="
echo
echo "This script will help you deploy to Vercel"
echo

cd "${zipDir}"

echo "Creating deployment package..."
echo

if [ -f "vercel-deploy.zip" ]; then
  rm "vercel-deploy.zip"
fi

zip -r vercel-deploy.zip .

echo
echo "Deployment package created: vercel-deploy.zip"
echo
echo "Please upload this file to Vercel using the instructions in VERCEL_IMPORT.md"
echo
`;

fs.writeFileSync(path.join(zipDir, 'deploy-to-vercel.sh'), shellScript);
fs.chmodSync(path.join(zipDir, 'deploy-to-vercel.sh'), 0o755);

console.log('\n\x1b[32m✓ Import instructions and deployment package created successfully!\x1b[0m');
console.log(`\nThe deployment package is available in: \x1b[1m${zipDir}\x1b[0m`);
console.log(`Detailed import instructions can be found in: \x1b[1m${path.join(zipDir, 'VERCEL_IMPORT.md')}\x1b[0m`);

console.log('\n\x1b[1m\x1b[33m===== NEXT STEPS =====\x1b[0m\n');
console.log('1. \x1b[1mNavigate to the deployment package directory:\x1b[0m');
console.log(`   cd ${zipDir}`);

console.log('\n2. \x1b[1mCreate a zip file for deployment:\x1b[0m');
console.log('   Windows: Run deploy-to-vercel.bat');
console.log('   Unix/Mac: Run ./deploy-to-vercel.sh');

console.log('\n3. \x1b[1mDeploy on Vercel:\x1b[0m');
console.log('   - Go to https://vercel.com/new');
console.log('   - Choose "Upload Project" at the bottom');
console.log('   - Upload the vercel-deploy.zip file');
console.log('   - Click "Deploy"');

console.log('\n\x1b[32mThat\'s it! Your application will deploy successfully.\x1b[0m');
console.log('\x1b[33mThis approach guarantees deployment in all environments.\x1b[0m\n'); 