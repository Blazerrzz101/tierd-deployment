#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Standardizing all specialized product pages...${NC}"

# Make sure we're in the project root
cd "$(dirname "$0")/.." || { 
  echo -e "${RED}Failed to navigate to project root${NC}"
  exit 1
}

# Get a list of all specialized product page directories
product_dirs=$(find app/products -type d -not -path "app/products" -not -path "app/products/[slug]" -not -path "app/products/[id]" -not -path "app/products/template")

echo -e "${YELLOW}Found $(echo "$product_dirs" | wc -l | xargs) specialized product directories to update${NC}"

# Counter for successful updates
count=0

# Process each specialized product directory
for dir in $product_dirs; do
  slug=$(basename "$dir")
  page_file="$dir/page.tsx"
  
  if [ -f "$page_file" ]; then
    echo -e "${BLUE}Processing ${slug}...${NC}"
    
    # Create a backup of the original file
    cp "$page_file" "${page_file}.bak"
    
    # Create standardized page component
    cat > "$page_file" << EOF
"use client"

import { UnifiedProductDetail } from "@/components/products/unified-product-detail"
import { Product } from "@/utils/product-utils"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"

export default function ProductPage() {
  const product = products.find(p => p.id === "${slug}")
  
  if (!product) {
    return notFound()
  }
  
  // Ensure all required properties exist on the product
  const standardizedProduct: Product = {
    ...product,
    id: product.id,
    name: product.name,
    category: product.category || "",
    description: product.description || "",
    image_url: product.imageUrl || product.image_url || "/images/product-placeholder.png",
    imageUrl: product.imageUrl || product.image_url || "/images/product-placeholder.png",
    url_slug: product.url_slug || "${slug}",
    upvotes: product.upvotes || 0,
    downvotes: product.downvotes || 0,
    score: (product.upvotes || 0) - (product.downvotes || 0),
    rank: product.rank || 0,
    price: product.price || 0,
    rating: product.rating || 0,
    review_count: product.review_count || 0,
    reviews: product.reviews || [],
    threads: product.threads || [],
    specifications: product.specifications || product.specs || {},
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  }

  return <UnifiedProductDetail product={standardizedProduct} />
}
EOF
    
    echo -e "${GREEN}✓ Updated ${slug}${NC}"
    count=$((count + 1))
  else
    echo -e "${RED}× No page.tsx found in ${slug}${NC}"
  fi
done

echo -e "${GREEN}Successfully standardized ${count} specialized product pages${NC}"

# Check if Next.js dev server is running and kill it
if lsof -ti:3000 &>/dev/null; then
  echo -e "${YELLOW}Stopping existing Next.js server on port 3000...${NC}"
  kill -9 $(lsof -ti:3000) &>/dev/null
  sleep 2
fi

echo -e "${GREEN}Starting development server for testing...${NC}"
echo -e "${YELLOW}Please check the following product detail pages to verify consistency:${NC}"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/hyperx-cloud-alpha"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/ducky-one-3"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/secretlab-titan-evo"
echo -e "  ${GREEN}✓${NC} http://localhost:3000/products/asus-pg279qm"

echo -e "\n${BLUE}Server is starting. Please visit http://localhost:3000${NC}"

npm run dev 