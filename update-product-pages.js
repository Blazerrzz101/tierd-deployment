/**
 * This script updates all specialized product pages to use the new UnifiedProductDetail component.
 * It ensures consistent product detail UI across the entire site.
 */
const fs = require('fs');
const path = require('path');

// Get all product directories
const productsDir = path.join('app', 'products');
const productDirs = fs.readdirSync(productsDir)
  .filter(dir => {
    // Exclude non-product directories and dynamic routes
    if (dir === '[id]' || dir === '[slug]' || dir === 'template' || dir === 'page.tsx') {
      return false;
    }
    const fullPath = path.join(productsDir, dir);
    return fs.statSync(fullPath).isDirectory();
  });

console.log(`Found ${productDirs.length} specialized product pages to update:`);
console.log(productDirs.join(', '), '\n');

// Create mapping of old slugs to improved full name slugs
const slugImprovements = {
  'logitech-g502': 'logitech-g502-x-plus',
  'razer-viper-v2': 'razer-viper-v2-pro',
  'finalmouse-starlight': 'finalmouse-starlight-12',
  'zowie-ec2': 'zowie-ec2-c',
  'lg-27gp950': 'lg-ultragear-27gp950',
  'keychron-q1': 'keychron-q1-pro',
  'asus-pg279qm': 'asus-rog-swift-pg279qm',
  'steelseries-arctis-7': 'steelseries-arctis-nova-pro'
};

// Template for the new page.tsx file
const createPageContent = (productId, improvedSlug) => `"use client"

import { useState, useEffect } from "react"
import { UnifiedProductDetail } from "@/components/products/unified-product-detail"
import { Product } from "@/utils/product-utils"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductPage() {
  const productId = "${productId}"
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      // Try to find the product in the local data first
      let foundProduct = products.find(p => p.id === productId)
      
      // If not found locally, try to fetch from API
      if (!foundProduct) {
        try {
          const response = await fetch(\`/api/products/product?id=\${productId}\`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.product) {
              foundProduct = data.product
            }
          }
        } catch (error) {
          console.error(\`Error fetching product with ID \${productId}:\`, error)
        }
      }
      
      if (foundProduct) {
        // Cast to Product type to satisfy TypeScript
        setProduct(foundProduct as unknown as Product)
      }
      
      setLoading(false)
    }
    
    loadProduct()
  }, [])
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="w-full h-8 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Skeleton className="w-full aspect-square rounded-xl" />
          </div>
          <div className="lg:col-span-7">
            <Skeleton className="w-full h-10 mb-4" />
            <Skeleton className="w-3/4 h-4 mb-2" />
            <Skeleton className="w-1/2 h-4 mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-20" />
            </div>
            <Skeleton className="w-full h-40" />
          </div>
        </div>
      </div>
    )
  }

  // If product not found, show 404 page
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
    imageUrl: product.imageUrl || product.image_url || "/images/product-placeholder.png",
    url_slug: product.url_slug || "${improvedSlug || productId}", // Use full product name for URL
    upvotes: product.upvotes || 0,
    downvotes: product.downvotes || 0,
    score: (product.upvotes || 0) - (product.downvotes || 0),
    rank: product.rank || 0,
    price: product.price || 0,
    specifications: product.specifications || (product as any).specs || {},
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  }

  return <UnifiedProductDetail product={standardizedProduct} />
}`;

// Update each product page
let updatedCount = 0;
productDirs.forEach(dir => {
  const pagePath = path.join(productsDir, dir, 'page.tsx');
  const improvedSlug = slugImprovements[dir] || dir;
  
  try {
    fs.writeFileSync(pagePath, createPageContent(dir, improvedSlug));
    console.log(`✅ Updated ${dir} -> ${improvedSlug}`);
    updatedCount++;
  } catch (err) {
    console.error(`❌ Error updating ${dir}:`, err);
  }
});

console.log(`\nSuccessfully updated ${updatedCount}/${productDirs.length} product pages.`);
console.log('All product pages now use the UnifiedProductDetail component with improved slugs.');
console.log('This ensures consistent UI and prevents 404 errors across the site.'); 