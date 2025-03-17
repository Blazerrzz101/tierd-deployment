# Ultimate Deployment Guide for Tierd

## Overview
This document explains how to deploy the Tierd application to Vercel following the comprehensive fixes applied.

## Deployment Steps

### 1. Set Up the Deployment

Go to the Vercel dashboard and create a new project from your GitHub repository.

### 2. Configure Project Settings

- **Framework**: Next.js
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `.next`
- **Node.js Version**: 18.x (IMPORTANT)

### 3. Environment Variables

Add these environment variables to your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app-url
NEXT_SKIP_TYPE_CHECK=true
CI=false
```

### 4. Deploy

Click the deploy button and wait for the build process to complete.

### 5. Verify Deployment

Once deployed, verify the following endpoints:

- Homepage: `/`
- Health check: `/api/health`

## Troubleshooting

If you encounter issues:

1. Check Vercel build logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure you're using Node.js 18.x
4. Try deploying from the `deployment-ready` branch

## Next Steps

After successful deployment:

1. Set up custom domain (if needed)
2. Configure analytics
3. Set up monitoring
4. Test all features thoroughly
