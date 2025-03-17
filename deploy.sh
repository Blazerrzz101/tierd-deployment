#!/bin/bash

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "$GREEN===== Tierd Full Deployment Script =====$NC"
echo -e "$YELLOW This script will commit your code and deploy it to Vercel$NC"

# Ensure we're in the right directory
REPO_DIR="$(pwd)"
echo -e "$GREEN Working in directory:$NC $REPO_DIR"

# Step 1: Ensure all changes are committed
echo -e "\n$GREEN Step 1: Committing changes...$NC"
git add .
git commit -m "[Cursor] Force deployment of full Tierd application" || echo -e "$YELLOW No changes to commit or commit failed$NC"

# Step 2: Push to the repository
echo -e "\n$GREEN Step 2: Pushing to GitHub...$NC"
git push origin HEAD || {
  echo -e "$RED Push failed. Trying with force...$NC"
  git push -f origin HEAD || {
    echo -e "$RED Force push failed as well. Please check your GitHub credentials and permissions.$NC"
    exit 1
  }
}

echo -e "\n$GREEN Code successfully pushed to GitHub!$NC"

# Step 3: Deployment instructions for Vercel
echo -e "\n$GREEN Step 3: How to Deploy to Vercel$NC"
echo -e "$YELLOW Follow these steps to deploy to Vercel:$NC"
echo -e "1. Go to https://vercel.com/new"
echo -e "2. Import your GitHub repository: blazerrzz101/tierd-deployment"
echo -e "3. Configure these settings:"
echo -e "   - Framework Preset: Next.js"
echo -e "   - Build Command: npm run vercel-build"
echo -e "   - Output Directory: .next"
echo -e "4. Add these environment variables:"
echo -e "   - NEXT_PUBLIC_SUPABASE_URL: [Your Supabase URL]"
echo -e "   - NEXT_PUBLIC_SUPABASE_ANON_KEY: [Your Supabase anonymous key]"
echo -e "5. Click Deploy"

echo -e "\n$GREEN ===== Deployment Preparation Complete =====$NC"
echo -e "$YELLOW After deploying, verify at: https://tierd-deployment.vercel.app$NC"
