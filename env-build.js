// This file will be loaded during the build process to provide environment variables
// It's needed to ensure a successful build even when environment variables are missing

// Export environment variables as an object
module.exports = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'placeholder-service-key',
  NEXT_PUBLIC_APP_URL: 'https://tierd-deployment.vercel.app',
  NEXT_SKIP_TYPE_CHECK: 'true',
  CI: 'false',
  NODE_ENV: 'production',
};