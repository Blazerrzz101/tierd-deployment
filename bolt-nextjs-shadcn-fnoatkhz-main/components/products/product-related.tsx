"use client"

import { Product } from "@/types"
import { products } from "@/lib/data"
import { ProductCard } from "@/components/rankings/product-card"

interface RelatedProductsProps {
  currentProductId: string
  category: string
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  // Get related products from the same category
  const relatedProducts = products
    .filter(p => p.category === category && p.id !== currentProductId)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3)

  if (relatedProducts.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Similar Products</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            variant="compact"
          />
        ))}
      </div>
    </div>
  )
}