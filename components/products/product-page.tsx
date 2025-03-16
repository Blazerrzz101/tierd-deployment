/**
 * Renders the product page, displaying a list of products with their rankings, votes, and reviews.
 * The component subscribes to real-time updates for vote and review changes, and updates the product data accordingly.
 */
'use client';

import { useState, useEffect } from 'react';
import { subscribeToRealtimeUpdates, supabase } from '@/supabaseClient';
import { Product } from "@/types/product"
import { ProductGallery } from "@/components/products/product-gallery"
import { ProductInfo } from "@/components/products/product-info"
import { ProductTabs } from "@/components/products/product-tabs"
import { RelatedProducts } from "@/components/products/related-products"

interface ProductPageProps {
  product: Product
}

export function ProductPage({ product }: ProductPageProps) {
  return (
    <div className="container space-y-8 pt-24 pb-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </div>

      <ProductTabs product={product} />
      
      <RelatedProducts 
        currentProductId={product.id}
        category={product.category}
      />
    </div>
  )
}
