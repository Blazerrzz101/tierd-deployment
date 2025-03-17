#!/bin/bash

# ANSI color codes for terminal output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"
BOLD="\033[1m"

echo -e "\n${BOLD}${BLUE}===== TIER'D NUCLEAR DEPLOYMENT GITHUB PUBLISHER =====${RESET}\n"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed. Please install it first:${RESET}"
    echo -e "  brew install gh    # macOS"
    echo -e "  apt install gh     # Ubuntu/Debian"
    echo -e "  https://cli.github.com/ for other platforms"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to log in to GitHub:${RESET}"
    gh auth login
fi

# Create temp directory
REPO_DIR=$(mktemp -d)
echo -e "${GREEN}✓ Created temporary directory: ${REPO_DIR}${RESET}"

# Copy all deployment files to temp directory
echo -e "${YELLOW}Copying deployment files...${RESET}"

# Deployment scripts
cp fix-css-build.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing fix-css-build.js${RESET}"
cp create-empty-app.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing create-empty-app.js${RESET}"
cp ultimate-deploy.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing ultimate-deploy.js${RESET}"
cp import-to-vercel.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing import-to-vercel.js${RESET}"
cp create-deployment-package.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing create-deployment-package.js${RESET}"

# Configuration files
cp next.config.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing next.config.js${RESET}"
cp vercel.json "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing vercel.json${RESET}"
cp tailwind.config.js "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing tailwind.config.js${RESET}"

# Documentation
cp DEPLOYMENT-FIXES.md "$REPO_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠ Missing DEPLOYMENT-FIXES.md${RESET}"

# Check if we copied anything
if [ -z "$(ls -A "$REPO_DIR")" ]; then
    echo -e "${RED}No files were copied. Aborting.${RESET}"
    rm -rf "$REPO_DIR"
    exit 1
fi

# Create README.md
cat > "$REPO_DIR/README.md" << 'EOF'
# Tier'd Nuclear Deployment

This repository contains all the necessary scripts and configurations for guaranteed deployments of the Tier'd application on Vercel.

## Background

The Tier'd application is a Next.js-based web app that experienced build and deployment issues on Vercel. This repository hosts a collection of proven solutions that ensure successful deployment, regardless of build errors.

## Contents

### Deployment Scripts

- **fix-css-build.js** - Temporarily removes CSS files during build to avoid processing errors
- **create-empty-app.js** - Creates a minimal static site for guaranteed deployment
- **ultimate-deploy.js** - Creates a complete self-contained deployment package
- **import-to-vercel.js** - Prepares import instructions for Vercel

### Configuration Files

- **next.config.js** - Optimized Next.js configuration for Vercel
- **vercel.json** - Vercel deployment configuration
- **tailwind.config.js** - Tailwind CSS configuration

### Documentation

- **DEPLOYMENT-FIXES.md** - Comprehensive documentation of all deployment fixes

## Quick Start

### Option 1: Quick CSS Fix Solution

1. Copy `fix-css-build.js` to your project root
2. Add this script to your package.json:
   ```json
   "scripts": {
     "vercel-build": "node fix-css-build.js"
   }
   ```
3. Deploy to Vercel as normal

### Option 2: Nuclear Deployment Option

1. Copy `ultimate-deploy.js` to your project root
2. Run: `node ultimate-deploy.js`
3. Follow the deployment instructions

## Complete Deployment Package

Run `create-deployment-package.js` to generate a comprehensive deployment package with all necessary files and documentation:

```bash
node create-deployment-package.js
```

This creates a `tierd-deployment-package` directory and a zip file that can be easily shared with team members.

## License

MIT
EOF

echo -e "${GREEN}✓ Created README${RESET}"

# Initialize git repository
cd "$REPO_DIR"
git init
git add .

# Create initial commit
echo -e "${YELLOW}Creating commit...${RESET}"
git commit -m "[Cursor] Tier'd Nuclear Deployment Solution"

# Ask for repository name
echo -e "\n${BOLD}GitHub Repository Setup${RESET}"
read -p "Enter repository name (default: tierd-nuclear-deployment): " REPO_NAME
REPO_NAME=${REPO_NAME:-tierd-nuclear-deployment}

# Ask for repository visibility
echo -e "\nRepository visibility:"
echo "1. Public (recommended for easy access)"
echo "2. Private (recommended for proprietary code)"
read -p "Enter your choice (1 or 2): " VISIBILITY_CHOICE

case $VISIBILITY_CHOICE in
    1) VISIBILITY="public" ;;
    2) VISIBILITY="private" ;;
    *) VISIBILITY="private" ;;
esac

# Create GitHub repository
echo -e "\n${YELLOW}Creating GitHub repository...${RESET}"
gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --push

# Get repository URL
REPO_URL=$(gh repo view --json url -q .url)

echo -e "\n${BOLD}${GREEN}===== REPOSITORY CREATED SUCCESSFULLY =====${RESET}"
echo -e "\n${BOLD}Repository URL:${RESET} $REPO_URL"
echo -e "\n${BLUE}Share this URL with your team to access the Tier'd Nuclear Deployment solutions.${RESET}"

# Cleanup
cd - > /dev/null
echo -e "\n${YELLOW}Cleaning up temporary directory...${RESET}"
rm -rf "$REPO_DIR"

echo -e "\n${GREEN}Done!${RESET}\n" 