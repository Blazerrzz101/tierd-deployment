"use client"

import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/rankings/product-card'
import { cn } from '@/lib/utils'

export function TopProducts() {
  const { products, loading, error } = useProducts()

  // Get top 3 products by rank
  const topProducts = products
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))
    .slice(0, 3)

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-[300px] animate-pulse rounded-lg bg-white/5",
              i === 0 && "col-span-2 lg:col-span-1"
            )}
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        Failed to load top products
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {topProducts.map((product, index) => (
        <ProductCard 
          key={product.id} 
          product={product}
          className={cn(
            index === 0 && "col-span-2 lg:col-span-1"
          )}
        />
      ))}
    </div>
  )
}