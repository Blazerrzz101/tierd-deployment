"use client"

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ProductRankingCard } from '@/components/rankings/product-ranking-card'
import { cn } from '@/lib/utils'

export const categories = [
  {
    id: 'all',
    name: 'All Products',
    description: 'All gaming peripherals',
    icon: '🎮',
  },
  {
    id: 'gaming-mice',
    name: 'Gaming Mice',
    description: 'High-performance gaming mice',
    icon: '🖱️',
  },
  {
    id: 'gaming-keyboards',
    name: 'Keyboards',
    description: 'Mechanical and gaming keyboards',
    icon: '⌨️',
  },
  {
    id: 'gaming-headsets',
    name: 'Headsets',
    description: 'Gaming headsets and audio',
    icon: '🎧',
  },
  {
    id: 'gaming-monitors',
    name: 'Monitors',
    description: 'Gaming monitors and displays',
    icon: '🖥️',
  },
]

export function ProductRankings() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [displayCount, setDisplayCount] = useState(5)
  const { products, loading, error, fetchProducts } = useProducts()

  // Filter products by category and limit display count
  const displayedProducts = products
    .filter(product => selectedCategory === 'all' || product.category === selectedCategory)
    .slice(0, displayCount)

  const hasMore = displayedProducts.length < products.filter(
    product => selectedCategory === 'all' || product.category === selectedCategory
  ).length

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setDisplayCount(5) // Reset display count when changing category
    if (categoryId === 'all') {
      fetchProducts()
    } else {
      fetchProducts(categoryId)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-destructive">Error loading products</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => fetchProducts(selectedCategory === 'all' ? undefined : selectedCategory)}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Category Navigation */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="lg"
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "min-w-[120px] rounded-full border-2",
                selectedCategory === category.id && 
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Product Rankings */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading products...</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">
              Try selecting a different category
            </p>
          </div>
        ) : (
          displayedProducts.map((product, index) => (
            <ProductRankingCard 
              key={product.id} 
              product={product}
              rank={index + 1}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 5)}
          >
            Show More
          </Button>
        </div>
      )}
    </div>
  )
}