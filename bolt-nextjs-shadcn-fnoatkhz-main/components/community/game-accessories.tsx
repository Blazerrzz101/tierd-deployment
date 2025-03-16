"use client"

import { products } from "@/lib/data"
import { ProductCard } from "@/components/rankings/product-card"

interface GameAccessoriesProps {
  gameId: string
}

export function GameAccessories({ gameId }: GameAccessoriesProps) {
  // Get recommended products for the game
  // For now, just show some random products
  const recommendedProducts = products.slice(0, 3)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Recommended Gaming Gear</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recommendedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}