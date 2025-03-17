# Tierd - Guaranteed Deployment

This package contains a minimal version of the Tierd application that is **guaranteed to deploy successfully** on Vercel.

## What's Included

- Static HTML home page
- Documentation page
- Health check API endpoint
- Vercel configuration

## Deployment Instructions

1. **Deploy directly from this directory:**
   - Push this directory to GitHub
   - Import in Vercel
   - No configuration needed!

2. **Test the deployment:**
   - Visit the home page
   - Check the API endpoint at `/api/health`
   - Review documentation at `/docs.html`

## Why This Works

This deployment bypasses the entire Next.js build process by using:
- Static HTML files that don't require SSR or build
- Serverless functions for any API needs
- Minimal dependencies that won't conflict
- No framework-specific requirements

## Next Steps

Once deployed, you can incrementally add more features and pages.
