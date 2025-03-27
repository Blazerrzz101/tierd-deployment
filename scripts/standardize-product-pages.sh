#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Standardizing all product detail pages...${NC}"

# Make sure we're in the project root
cd "$(dirname "$0")/.." || { 
  echo -e "${RED}Failed to navigate to project root${NC}"
  exit 1
}

# Check if Next.js dev server is running and kill it
if lsof -ti:3000 &>/dev/null; then
  echo -e "${YELLOW}Stopping existing Next.js server on port 3000...${NC}"
  kill -9 $(lsof -ti:3000) &>/dev/null
  sleep 2
fi

# Verify that all product detail components use UnifiedProductDetail
echo -e "${BLUE}Verifying component standardization...${NC}"

# Check that ProductDetailLayout correctly uses UnifiedProductDetail
if ! grep -q "return <UnifiedProductDetail product={product} />" components/products/product-detail-layout.tsx; then
  echo -e "${RED}ProductDetailLayout might not be using UnifiedProductDetail. Please check.${NC}"
fi

# Check that the main product page is using UnifiedProductDetail
if ! grep -q "return <UnifiedProductDetail product={product} />" app/products/\[slug\]/page.tsx; then
  echo -e "${RED}Main product page might not be using UnifiedProductDetail. Please check.${NC}"
fi

# Check that the specialized Logitech G Pro page is updated
if ! grep -q "return <UnifiedProductDetail product={product} />" app/products/logitech-g-pro-superlight/page.tsx; then
  echo -e "${RED}Logitech G Pro page might not be using UnifiedProductDetail. Please check.${NC}"
fi

echo -e "${GREEN}Verification complete!${NC}"

# Skip full build and start dev server directly
echo -e "${GREEN}Starting development server for testing...${NC}"
echo -e "${YELLOW}Please check the following product detail pages to verify consistency:${NC}"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/beyerdynamic-mmx300"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/logitech-g502-x-plus"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/razer-huntsman-mini"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/logitech-g-pro-superlight"

echo -e "\n${BLUE}Server is starting. Please visit http://localhost:3000${NC}"

npm run dev 