# Tierd Deployment Guide

This document provides instructions for deploying the Tierd application to Vercel.

## Step 1: Set Up the Project on Vercel

1. Go to [Vercel](https://vercel.com/new)
2. Click on "Import Project"
3. Select "Import Git Repository"
4. Choose "GitHub" (if not already connected, connect your GitHub account)
5. Find and select the `Blazerrzz101/tierd-deployment` repository
6. Vercel will automatically detect Next.js settings

## Step 2: Configure Project Settings

In the Vercel project configuration screen:

- **Framework Preset**: Next.js (should be automatically detected)
- **Root Directory**: `.` (if not already set)
- **Build Command**: `next build`
- **Install Command**: `npm install --force` (use force to ensure all dependencies install properly)
- **Output Directory**: `.next` (should be automatically set)

## Step 3: Configure Environment Variables

Add the following environment variables:

```
FORCE_MAIN_SERVER=true
NEXT_PUBLIC_APP_URL=https://tierd-deployment.vercel.app
NEXTAUTH_URL=https://tierd-deployment.vercel.app
NODE_ENV=production
FRESH_DEPLOY=true
FORCE_CLEAN_START=true
NEXT_SKIP_TYPE_CHECK=true
NEXT_TELEMETRY_DISABLED=1
USE_LOCAL_VERSION=true
PRESERVE_EXACT_BUILD=true
SKIP_OPTIMIZATION=true
```

## Step 4: Deploy

Click the "Deploy" button to start the deployment process.

## Step 5: Monitor Deployment

- Watch the build logs for any errors
- Once deployed, Vercel will provide a URL (usually in the format `https://tierd-deployment.vercel.app`)
- Visit the URL to verify the deployment worked correctly

## Troubleshooting

If you encounter any issues:

1. **Build Errors**: Check the build logs for specific error messages
2. **404 Errors**: Ensure your environment variables are set correctly
3. **Blank Page**: Check browser console for JavaScript errors

## Force Rebuild

If you need to force a rebuild without changing any code:

1. Go to Vercel dashboard > Your project > Settings > Git
2. Scroll down to "Deploy Hooks" 
3. Create a new deploy hook with a name like "Force Rebuild"
4. Use the generated URL with curl to trigger a rebuild:

```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/YOUR_DEPLOY_HOOK_URL
```

## Custom Domain (Optional)

To add a custom domain:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS settings

---

Good luck with your deployment! If you encounter any issues, check the Vercel logs for detailed error messages. 