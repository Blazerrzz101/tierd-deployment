
# Tierd Minimal Deployment Instructions

## Overview
This is a simplified version of the Tierd application that has been prepared for deployment to Vercel.
It uses Next.js 14 with the App Router architecture and includes only the essential files needed for a successful deployment.

## Deployment Steps

1. **Go to Vercel:**
   - Visit [https://vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository: `Blazerrzz101/tierd-deployment`

2. **Configure Settings:**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next` (default)

3. **Environment Variables:**
   Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Visit the deployed URL

5. **Testing:**
   - Visit the root URL to see the home page
   - Click "Test App Router" or go to `/test-app-router` to verify the App Router is working
   - Visit `/api/health` to test the API endpoint

## Troubleshooting

If deployment fails:
1. Check the build logs in the Vercel dashboard
2. Ensure all environment variables are correctly set
3. Verify the branch you're deploying contains the minimal app structure

For any issues, contact the repository maintainer.
