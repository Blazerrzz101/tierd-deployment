#!/bin/bash

# Colors for terminal
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "\n$GREEN===== Tierd Ultimate Deployment Helper =====$NC\n"

echo -e "$BLUE This script will help you deploy the fixed version of Tierd $NC"
echo -e "$YELLOW After addressing all build errors and compatibility issues $NC\n"

# Clean up and rebuild
echo -e "\n$GREEN Step 1: Clearing cache and performing ultra build...$NC"
rm -rf .next
rm -rf node_modules/.cache

npm run ultra-build

if [ $? -ne 0 ]; then
  echo -e "$RED Build failed! Check the errors above.$NC"
  exit 1
fi

echo -e "\n$GREEN Build successful!$NC"

# Push to GitHub
echo -e "\n$GREEN Step 2: Pushing to GitHub...$NC"
git add .
git commit -m "[Cursor] Final deployment build ready"
git push origin deployment-ready

# Deployment instructions
echo -e "\n$GREEN===== DEPLOYMENT INSTRUCTIONS =====$NC"
echo -e "$YELLOW To deploy to Vercel, follow these steps:$NC\n"

echo -e "1. Go to $BLUE https://vercel.com/new $NC"
echo -e "2. Import your GitHub repository"
echo -e "3. Select the $GREEN deployment-ready $NC branch"
echo -e "4. Configure the project with these settings:"
echo -e "   - Framework Preset: $GREEN Next.js $NC"
echo -e "   - Node.js Version: $GREEN 18.x $NC (VERY IMPORTANT)"
echo -e "   - Build Command: $GREEN npm run vercel-build $NC"
echo -e "   - Output Directory: $GREEN .next $NC"
echo -e "5. Add these environment variables:"
echo -e "   - $YELLOW NEXT_PUBLIC_SUPABASE_URL $NC: (your Supabase URL)"
echo -e "   - $YELLOW NEXT_PUBLIC_SUPABASE_ANON_KEY $NC: (your Supabase anon key)"
echo -e "   - $YELLOW SUPABASE_SERVICE_ROLE_KEY $NC: (your Supabase service role key)"
echo -e "   - $YELLOW NEXT_SKIP_TYPE_CHECK $NC: true"
echo -e "   - $YELLOW CI $NC: false"
echo -e "6. Click $GREEN Deploy $NC\n"

echo -e "$GREEN Good luck with your deployment! $NC"
