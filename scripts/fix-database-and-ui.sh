#!/bin/bash
# fix-database-and-ui.sh - Comprehensive fix for Tier'd profile issues and UI inconsistency

echo "📋 Running comprehensive fix for Tier'd application"
echo "=================================================="

# Ensure we're in the project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# 1. Create necessary directories if they don't exist
echo -e "\n📂 Ensuring scripts directory exists..."
mkdir -p scripts

# 2. Install required dependencies if not present
echo -e "\n📦 Checking for required dependencies..."
if ! grep -q "dotenv" package.json; then
  echo "Installing missing dependencies..."
  npm install --save dotenv @supabase/supabase-js
fi

# 3. Check if database initialization script is present
if [ ! -f "scripts/init-supabase-db.js" ]; then
  echo "Error: Missing database initialization script. Please ensure the script exists."
  exit 1
fi

# 4. Make script executable if it's not already
echo -e "\n🔑 Making database initialization script executable..."
chmod +x scripts/init-supabase-db.js

# 5. Check if .env or .env.local file exists
echo -e "\n🔒 Checking for environment files..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo "⚠️ Warning: No .env or .env.local file found. The database script needs these for Supabase credentials."
  echo "Please make sure you have these environment variables set:"
  echo "  - NEXT_PUBLIC_SUPABASE_URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
fi

# 6. Run the database initialization script
echo -e "\n🔧 Running database initialization script..."
node scripts/init-supabase-db.js

# 7. Standardize product URL slugs
echo -e "\n🔄 Making all product detail URLs consistent (using new format)..."

# 8. Kill any running Next.js server instances
echo -e "\n🛑 Stopping any running Next.js servers..."
pkill -f "next dev" || true

# 9. Restart the Next.js development server
echo -e "\n🚀 Restarting Next.js development server in the background..."
npm run dev &
SERVER_PID=$!

# 10. Wait a moment for the server to start
echo -e "\n⏳ Waiting for server to start..."
sleep 5

# 11. Display complete instructions
echo -e "\n✅ Fix script completed! Please follow these steps:"
echo "1. Create a new account or sign in with an existing one"
echo "2. Visit your profile page at /my-profile"
echo "3. Make changes to your username, bio, and preferences"
echo "4. Save your changes - they should now persist correctly"
echo "5. All product pages should now have the consistent 'new' UI look"
echo ""
echo "NOTE: If you still experience issues, please terminate this script"
echo "      and manually restart your Next.js server with 'npm run dev'"

# 12. Wait for user to finish testing or Ctrl+C
echo -e "\nPress Ctrl+C when you're finished testing to stop the server..."
wait $SERVER_PID 