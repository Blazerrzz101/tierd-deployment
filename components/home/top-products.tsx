"use client"

import { products } from "@/lib/data"
import { ProductCard } from "@/components/rankings/product-card"

export function TopProducts() {
  // Get top 3 products by votes
  const topProducts = [...products]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3)

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {topProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}