#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Tierd Full Deployment Script =====${NC}"
echo -e "${YELLOW}This script will commit your code and deploy it to Vercel${NC}"

# Ensure we're in the right directory
REPO_DIR="$(pwd)"
echo -e "${GREEN}Working in directory:${NC} $REPO_DIR"

# Step 1: Ensure all changes are committed
echo -e "\n${GREEN}Step 1: Committing changes...${NC}"
git add .
git commit -m "[Cursor] Force deployment of Tierd application" || echo -e "${YELLOW}No changes to commit or commit failed${NC}"

# Step 2: Push to the repository with the correct refspec
echo -e "\n${GREEN}Step 2: Pushing to GitHub...${NC}"
git push origin HEAD:refs/heads/main || {
  echo -e "${RED}Push failed. Trying with force...${NC}"
  git push -f origin HEAD:refs/heads/main || {
    echo -e "${RED}Force push failed as well. Please check your GitHub credentials and permissions.${NC}"
    exit 1
  }
}

echo -e "\n${GREEN}Code successfully pushed to GitHub!${NC}"

# Step 3: Verify Vercel CLI or offer manual deployment instructions
echo -e "\n${GREEN}Step 3: Deploying to Vercel...${NC}"

if command -v vercel &> /dev/null; then
  echo -e "${YELLOW}Vercel CLI found. Attempting deployment...${NC}"
  vercel --prod || {
    echo -e "${RED}Vercel CLI deployment failed. Please follow manual instructions below.${NC}"
  }
else
  echo -e "${YELLOW}Vercel CLI not found. Please follow these steps for manual deployment:${NC}"
  echo -e "1. Go to https://vercel.com/new"
  echo -e "2. Import your GitHub repository: blazerrzz101/tierd-deployment"
  echo -e "3. Configure these settings:"
  echo -e "   - Framework Preset: Next.js"
  echo -e "   - Build Command: next build"
  echo -e "   - Output Directory: .next"
  echo -e "4. Add any required environment variables"
  echo -e "5. Click Deploy"
  
  # Generate a deployment hook curl command for later use
  echo -e "\n${YELLOW}After deployment, if you need to force a rebuild, you can create a Deploy Hook in the Vercel dashboard and use:${NC}"
  echo -e "curl -X POST https://api.vercel.com/v1/integrations/deploy/YOUR_DEPLOY_HOOK_URL"
fi

echo -e "\n${GREEN}===== Deployment Process Complete =====${NC}"
echo -e "${YELLOW}Verify your deployment on the Vercel dashboard${NC}"
echo -e "${YELLOW}URL will be available at: https://tierd-deployment.vercel.app (or your custom domain)${NC}"

# For troubleshooting: create a force rebuild script
echo -e "\n${GREEN}Creating a force rebuild script for future use...${NC}"

cat > force-rebuild.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./force-rebuild.sh <your-vercel-deploy-hook-url>"
  echo "Create a deploy hook in Vercel dashboard: Project Settings > Git > Deploy Hooks"
  exit 1
fi

echo "Triggering force rebuild..."
curl -X POST "$1"
echo -e "\nRebuild triggered! Check Vercel dashboard for status."
EOF

chmod +x force-rebuild.sh

echo -e "${GREEN}Created force-rebuild.sh - use this if you need to force Vercel to rebuild without code changes${NC}"
echo -e "${GREEN}Usage: ./force-rebuild.sh <your-vercel-deploy-hook-url>${NC}" 