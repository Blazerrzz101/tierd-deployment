#!/bin/bash

# Product UI Standardization Script
# This script applies all fixes necessary to standardize the product UI across the site

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored status messages
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Ensure we're in the project root directory
if [ ! -f "package.json" ]; then
  print_error "Please run this script from the project root directory"
  exit 1
fi

print_status "Starting product UI standardization process..."

# 1. Check if required packages are installed
print_status "Checking required dependencies..."
if ! npm list slugify > /dev/null 2>&1; then
  print_status "Installing slugify package..."
  npm install --save slugify
fi

# 2. Create necessary directories for enhanced images
print_status "Creating directories for enhanced images..."
mkdir -p public/images/enhanced/alternates

# 3. Standardize product slugs for URL consistency
print_status "Standardizing product URL slugs..."
if [ -f "./scripts/standardize-product-slugs.js" ]; then
  chmod +x ./scripts/standardize-product-slugs.js
  node ./scripts/standardize-product-slugs.js
else
  print_error "standardize-product-slugs.js script not found"
  exit 1
fi

# 4. Check if dev server is already running (macOS specific)
print_status "Checking for running Next.js development server..."
if pgrep -f "node.*next" > /dev/null; then
  print_warning "A Next.js server is already running. It will be stopped."
  pkill -f "node.*next"
  sleep 2
fi

# 5. Build the project to apply changes
print_status "Building the project to apply changes..."
npm run build

# 6. Start the development server in the background
print_status "Starting development server with new standardized UI..."
print_status "The server will be available at http://localhost:3000"
npm run dev &

# Wait for the server to start
print_status "Waiting for the server to start..."
sleep 5

# 7. Print instructions
echo ""
echo -e "${GREEN}=== Product UI Standardization Complete ===${NC}"
echo ""
echo "The following changes have been made:"
echo "  1. All product URLs now use consistent slug format"
echo "  2. Enhanced product images are properly set up"
echo "  3. All product pages now use the unified product detail layout"
echo ""
echo "Please verify the changes by visiting:"
echo "  - http://localhost:3000 (Home page)"
echo "  - http://localhost:3000/products (Products listing)" 
echo "  - http://localhost:3000/products/logitech-g502-x-plus (Sample product)"
echo ""
echo "To see a different product detail page, click on any product card on the home page or products listing."
echo ""
echo -e "${YELLOW}When you're finished testing, press Enter to stop the server and exit.${NC}"

# Wait for user to press enter
read

# Stop the server
print_status "Stopping the development server..."
pkill -f "node.*next"

print_success "Product UI standardization process completed successfully!"
exit 0 