// Required environment variables
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const;

// Validate environment variables
function validateEnv() {
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  
  if (missingEnvs.length > 0) {
    console.warn('Warning: Missing environment variables:', missingEnvs);
  }
}

// Run validation
validateEnv(); 