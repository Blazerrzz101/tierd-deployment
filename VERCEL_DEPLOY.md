
# Vercel Deployment Instructions

Follow these steps to deploy the project:

1. Go to the [Vercel Import page](https://vercel.com/import)
2. Select "Import Git Repository"
3. Choose the GitHub repository: `Blazerrzz101/tierd-deployment`
4. Use these settings:
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build`
   - Install Command: `npm install`
   - Output Directory: `.next`

5. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `FORCE_CLEAN_START`: true

6. Click "Deploy"

After deployment, visit `/test-app-router` to confirm the App Router is working.
