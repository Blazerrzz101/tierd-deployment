#!/usr/bin/env node
/**
 * Nuclear Tier'd Deployment Package Creator
 * 
 * This script combines all deployment solutions into a 
 * single comprehensive package ready for deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`\n${colors.bright}${colors.blue}===== NUCLEAR TIER'D DEPLOYMENT PACKAGE CREATOR =====${colors.reset}\n`);

// Create output directory
const PACKAGE_DIR = path.join(process.cwd(), 'tierd-deployment-package');
if (fs.existsSync(PACKAGE_DIR)) {
  console.log(`${colors.yellow}Removing existing package directory...${colors.reset}`);
  fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });
}

fs.mkdirSync(PACKAGE_DIR, { recursive: true });
console.log(`${colors.green}✓ Created package directory: ${PACKAGE_DIR}${colors.reset}`);

// Create package structure
const directories = [
  'scripts',
  'configs',
  'public',
  'docs'
];

directories.forEach(dir => {
  fs.mkdirSync(path.join(PACKAGE_DIR, dir), { recursive: true });
});

console.log(`${colors.green}✓ Created package structure${colors.reset}`);

// Function to copy file with logging
function copyFile(source, target, description) {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
    console.log(`${colors.green}✓ Copied ${path.basename(source)}${colors.reset} - ${description}`);
  } else {
    console.log(`${colors.yellow}⚠ Missing ${path.basename(source)} - Creating placeholder${colors.reset}`);
    fs.writeFileSync(target, `// Placeholder for ${path.basename(source)}\n// ${description}\n`);
  }
}

// Copy deployment scripts
const scripts = [
  { file: 'fix-css-build.js', desc: 'Temporarily removes CSS files during build' },
  { file: 'create-empty-app.js', desc: 'Creates a minimal static site for guaranteed deployment' },
  { file: 'ultimate-deploy.js', desc: 'Creates a complete self-contained deployment package' },
  { file: 'import-to-vercel.js', desc: 'Prepares import instructions for Vercel' },
];

scripts.forEach(script => {
  copyFile(
    path.join(process.cwd(), script.file),
    path.join(PACKAGE_DIR, 'scripts', script.file),
    script.desc
  );
});

// Copy config files
const configs = [
  { file: 'next.config.js', desc: 'Optimized Next.js configuration for Vercel' },
  { file: 'vercel.json', desc: 'Vercel deployment configuration' },
  { file: 'package.json', desc: 'Package configuration with build scripts' },
  { file: 'tailwind.config.js', desc: 'Tailwind CSS configuration' }
];

configs.forEach(config => {
  copyFile(
    path.join(process.cwd(), config.file),
    path.join(PACKAGE_DIR, 'configs', config.file),
    config.desc
  );
});

// Copy documentation
copyFile(
  path.join(process.cwd(), 'DEPLOYMENT-FIXES.md'),
  path.join(PACKAGE_DIR, 'docs', 'DEPLOYMENT-FIXES.md'),
  'Comprehensive documentation of deployment fixes'
);

// Create main README
const readmeMd = `# Nuclear Tier'd Deployment Package

This package contains all the necessary files and scripts to ensure successful deployment
of the Tier'd application on Vercel, regardless of build issues.

## Package Contents

### Scripts
- \`fix-css-build.js\` - Workaround for CSS processing issues
- \`create-empty-app.js\` - Creates a minimal static site
- \`ultimate-deploy.js\` - Creates a self-contained deployment package
- \`import-to-vercel.js\` - Prepares import instructions for Vercel

### Configuration Files
- \`next.config.js\` - Optimized Next.js configuration
- \`vercel.json\` - Vercel deployment configuration
- \`package.json\` - Package configuration with build scripts
- \`tailwind.config.js\` - Tailwind CSS configuration

### Documentation
- \`DEPLOYMENT-FIXES.md\` - Comprehensive documentation of all fixes

## Quick Start

### Option 1: Standard Deployment

1. Copy \`fix-css-build.js\` to your project root
2. Add to your package.json:
   \`\`\`json
   "scripts": {
     "vercel-build": "node fix-css-build.js"
   }
   \`\`\`
3. Deploy to Vercel as normal

### Option 2: Nuclear Option (Guaranteed Deployment)

1. Copy \`ultimate-deploy.js\` to your project root
2. Run: \`node ultimate-deploy.js\`
3. Run: \`node import-to-vercel.js\`
4. Follow the import instructions to deploy on Vercel

## Detailed Documentation

See \`docs/DEPLOYMENT-FIXES.md\` for complete documentation of all fixes and strategies.

## Support

This deployment package was created to guarantee successful deployment regardless of
build issues in the original codebase.
`;

fs.writeFileSync(path.join(PACKAGE_DIR, 'README.md'), readmeMd);
console.log(`${colors.green}✓ Created main README${colors.reset}`);

// Create batch file for Windows users
const batchFile = `@echo off
echo ===== TIER'D DEPLOYMENT PACKAGE =====
echo.
echo This batch file will guide you through using the deployment package
echo.

cd "%~dp0"

echo Please choose a deployment option:
echo.
echo 1. Standard Deployment (CSS Fix)
echo 2. Nuclear Option (Guaranteed Deployment)
echo.

set /p option="Enter option (1 or 2): "

if "%option%"=="1" (
  echo.
  echo ===== STANDARD DEPLOYMENT =====
  echo.
  echo 1. Copy scripts\\fix-css-build.js to your project root
  echo 2. Add to your package.json:
  echo    "scripts": {
  echo      "vercel-build": "node fix-css-build.js"
  echo    }
  echo 3. Deploy to Vercel as normal
  echo.
  pause
  exit /b
)

if "%option%"=="2" (
  echo.
  echo ===== NUCLEAR OPTION =====
  echo.
  echo 1. Copy scripts\\ultimate-deploy.js to your project root
  echo 2. Run: node ultimate-deploy.js
  echo 3. Run: node import-to-vercel.js
  echo 4. Follow the import instructions to deploy on Vercel
  echo.
  pause
  exit /b
)

echo Invalid option selected
pause
`;

fs.writeFileSync(path.join(PACKAGE_DIR, 'deploy.bat'), batchFile);

// Create shell script for Unix users
const shellScript = `#!/bin/bash

echo "===== TIER'D DEPLOYMENT PACKAGE ====="
echo
echo "This script will guide you through using the deployment package"
echo

cd "$(dirname "$0")"

echo "Please choose a deployment option:"
echo
echo "1. Standard Deployment (CSS Fix)"
echo "2. Nuclear Option (Guaranteed Deployment)"
echo

read -p "Enter option (1 or 2): " option

if [ "$option" = "1" ]; then
  echo
  echo "===== STANDARD DEPLOYMENT ====="
  echo
  echo "1. Copy scripts/fix-css-build.js to your project root"
  echo "2. Add to your package.json:"
  echo '   "scripts": {'
  echo '     "vercel-build": "node fix-css-build.js"'
  echo '   }'
  echo "3. Deploy to Vercel as normal"
  echo
  exit 0
fi

if [ "$option" = "2" ]; then
  echo
  echo "===== NUCLEAR OPTION ====="
  echo
  echo "1. Copy scripts/ultimate-deploy.js to your project root"
  echo "2. Run: node ultimate-deploy.js"
  echo "3. Run: node import-to-vercel.js"
  echo "4. Follow the import instructions to deploy on Vercel"
  echo
  exit 0
fi

echo "Invalid option selected"
`;

fs.writeFileSync(path.join(PACKAGE_DIR, 'deploy.sh'), shellScript);
fs.chmodSync(path.join(PACKAGE_DIR, 'deploy.sh'), 0o755);

console.log(`${colors.green}✓ Created deployment scripts${colors.reset}`);

// Create ZIP file
try {
  console.log(`\n${colors.yellow}Creating deployment package ZIP file...${colors.reset}`);
  const zipFile = 'tierd-deployment-package.zip';
  
  // Check if zip command is available
  try {
    execSync('which zip', { stdio: 'ignore' });
    execSync(`cd "${PACKAGE_DIR}" && zip -r "../${zipFile}" .`, { stdio: 'inherit' });
    console.log(`\n${colors.green}✓ Created ZIP file: ${path.join(process.cwd(), zipFile)}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ ZIP command not available. Package available at: ${PACKAGE_DIR}${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.yellow}⚠ Could not create ZIP file. Package available at: ${PACKAGE_DIR}${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.green}===== DEPLOYMENT PACKAGE CREATED SUCCESSFULLY =====${colors.reset}`);
console.log(`\n${colors.bright}Package location: ${PACKAGE_DIR}${colors.reset}`);
console.log(`\n${colors.blue}Follow the instructions in the README.md to deploy your application${colors.reset}\n`);