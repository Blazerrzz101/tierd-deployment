"use client"

import { UnifiedProductDetail } from "@/components/products/unified-product-detail"
import { Product } from "@/utils/product-utils"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"

/**
 * Template for specialized product pages
 * Copy this file to create a new specialized product page
 * This ensures all product pages use the same unified component
 */
export default function ProductPage() {
  // Replace 'template' with the correct product ID 
  const productId = 'template';
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return notFound();
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
    url_slug: product.url_slug || productId,
    upvotes: product.upvotes || 0,
    downvotes: product.downvotes || 0,
    score: (product.upvotes || 0) - (product.downvotes || 0),
    rank: product.rank || 0,
    price: product.price || 0,
    rating: product.rating || 0,
    review_count: product.review_count || 0,
    reviews: product.reviews || [],
    threads: product.threads || [],
    specifications: product.specifications || (product as any).specs || {},
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  };

  return <UnifiedProductDetail product={standardizedProduct} />;
}