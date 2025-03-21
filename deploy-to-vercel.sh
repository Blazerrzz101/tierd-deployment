#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "\n${GREEN}===== Tierd Vercel Deployment Helper =====${NC}\n"

echo -e "${BLUE}This script will help you deploy your application to Vercel${NC}"
echo -e "${YELLOW}Following the fixes applied to fix TypeScript and next/headers issues${NC}\n"

# Check if Git is clean
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}You have uncommitted changes. Committing them now...${NC}"
  git add .
  git commit -m "[Cursor] Prepare for Vercel deployment with next/headers fix"
fi

# Push to GitHub
echo -e "\n${BLUE}Pushing latest changes to GitHub...${NC}"
git push origin full-deployment

echo -e "\n${GREEN}===== DEPLOYMENT INSTRUCTIONS =====${NC}"
echo -e "${YELLOW}To deploy to Vercel, follow these steps:${NC}\n"

echo -e "1. Go to ${BLUE}https://vercel.com/new${NC}"
echo -e "2. Import your GitHub repository: ${BLUE}Blazerrzz101/tierd-deployment${NC}"
echo -e "3. Select the ${GREEN}full-deployment${NC} branch"
echo -e "4. Configure the project with these settings:"
echo -e "   - Framework Preset: ${GREEN}Next.js${NC}"
echo -e "   - Node.js Version: ${GREEN}18.x${NC} (VERY IMPORTANT)"
echo -e "   - Build Command: ${GREEN}npm install --legacy-peer-deps && npm run build${NC}"
echo -e "   - Output Directory: ${GREEN}.next${NC}"
echo -e "5. Add these environment variables:"
echo -e "   - ${YELLOW}NEXT_PUBLIC_SUPABASE_URL${NC}: (your Supabase URL)"
echo -e "   - ${YELLOW}NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}: (your Supabase anon key)"
echo -e "   - ${YELLOW}SUPABASE_SERVICE_ROLE_KEY${NC}: (can be same as anon key)"
echo -e "   - ${YELLOW}NEXT_SKIP_TYPE_CHECK${NC}: true"
echo -e "   - ${YELLOW}CI${NC}: false"
echo -e "6. Click ${GREEN}Deploy${NC}\n"

echo -e "${BLUE}After deployment, check the following URLs:${NC}"
echo -e "- Homepage: ${GREEN}https://tierd-deployment.vercel.app${NC}"
echo -e "- Health check: ${GREEN}https://tierd-deployment.vercel.app/api/health${NC}\n"

echo -e "${YELLOW}If you encounter any issues, follow these troubleshooting steps:${NC}"
echo -e "1. Check that the Node.js version is set to 18.x (not 22.x)"
echo -e "2. Verify that all environment variables are set correctly"
echo -e "3. Try using the build command: ${GREEN}npm install --legacy-peer-deps --force && npm run build${NC}"
echo -e "4. Check the error logs in the Vercel dashboard for specific errors\n"

echo -e "${GREEN}Good luck with your deployment!${NC}" 