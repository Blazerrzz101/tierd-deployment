# Vercel Environment Variables Setup

To fix the deployment error, you need to add the following environment variables in your Vercel project settings:

## Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL** (Already added)
   - Your Supabase project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (Already added)
   - Your Supabase anonymous key

3. **SUPABASE_SERVICE_ROLE_KEY** (Missing - causing the error)
   - Your Supabase service role key
   - If you don't have this key, you can:
     - Get it from your Supabase dashboard under Project Settings > API
     - OR set this to be the same as your NEXT_PUBLIC_SUPABASE_ANON_KEY as a temporary workaround

## How to Add Environment Variables

1. In your Vercel project dashboard, click on "Settings"
2. Navigate to "Environment Variables"
3. Add a new variable named `SUPABASE_SERVICE_ROLE_KEY` with the value from your Supabase dashboard
4. Save the changes
5. Redeploy your application

## Additional Configuration

If you're still encountering errors after adding the environment variables, try the following:

1. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., https://tierd-deployment.vercel.app)
2. Make sure `NODE_ENV` is set to `production`
3. Consider setting `NEXT_SKIP_TYPE_CHECK=true` to bypass TypeScript errors

After adding these variables, trigger a new deployment to apply the changes. 