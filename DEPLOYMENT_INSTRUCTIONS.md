# Deployment Instructions

## Environment Variables

1. **Required Variables**
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (can use the same value as NEXT_PUBLIC_SUPABASE_ANON_KEY if needed)

2. **Optional Variables**
   - NEXT_PUBLIC_APP_URL (your Vercel URL, e.g., https://tierd-deployment.vercel.app)
   - NEXT_SKIP_TYPE_CHECK=true (recommended)

## Deployment Steps

1. Push your code to GitHub
2. Go to Vercel and import your repository
3. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
4. Add the environment variables listed above
5. Deploy

## Troubleshooting

If you encounter TypeScript errors:
- Set NEXT_SKIP_TYPE_CHECK=true in your environment variables
- Add "typescript.ignoreBuildErrors": true in your Vercel project settings
