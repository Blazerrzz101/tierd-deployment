"use client"

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ProductRankingCard } from '@/components/rankings/product-ranking-card'
import { cn } from '@/lib/utils'
import { Product } from '@/types/product'
import Link from "next/link"
import Image from "next/image"
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatePresence, motion } from "framer-motion"
import { createProductUrl } from "@/utils/product-utils"

export const categories = [
  {
    id: 'all',
    name: 'All Products',
    description: 'All gaming peripherals',
    icon: '🎮',
    color: 'bg-primary/10 hover:bg-primary/20 text-primary',
  },
  {
    id: 'gaming-mice',
    name: 'Gaming Mice',
    description: 'High-performance gaming mice',
    icon: '🖱️',
    color: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    description: 'Mechanical and gaming keyboards',
    icon: '⌨️',
    color: 'bg-accent/10 hover:bg-accent/20 text-accent',
  },
  {
    id: 'headsets',
    name: 'Headsets',
    description: 'Gaming headsets and audio',
    icon: '🎧',
    color: 'bg-primary/10 hover:bg-primary/20 text-primary',
  },
  {
    id: 'monitors',
    name: 'Monitors',
    description: 'Gaming monitors and displays',
    icon: '🖥️',
    color: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
  },
  {
    id: 'controllers',
    name: 'Controllers',
    description: 'Gaming controllers',
    icon: '🎮',
    color: 'bg-accent/10 hover:bg-accent/20 text-accent',
  },
  {
    id: 'chairs',
    name: 'Gaming Chairs',
    description: 'Ergonomic gaming chairs',
    icon: '🪑',
    color: 'bg-primary/10 hover:bg-primary/20 text-primary',
  },
]

// Helper function to calculate score
const calculateScore = (product: Partial<Product>) => {
  const upvotes = typeof product.upvotes === 'number' ? product.upvotes : 0;
  const downvotes = typeof product.downvotes === 'number' ? product.downvotes : 0;
  return upvotes - downvotes;
};

export function ProductRankings() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [displayCount, setDisplayCount] = useState(5)
  const { products, loading, error, fetchProducts } = useProducts()

  // Filter products by category, sort by score, and limit display count
  const displayedProducts = products
    .filter(product => selectedCategory === 'all' || product.category === selectedCategory)
    .sort((a, b) => {
      // First sort by score (upvotes - downvotes) in descending order
      const scoreA = a.score !== undefined ? a.score : calculateScore(a);
      const scoreB = b.score !== undefined ? b.score : calculateScore(b);
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // If scores are equal, sort by total votes (upvotes + downvotes) in descending order
      const totalVotesA = (a.upvotes || 0) + (a.downvotes || 0);
      const totalVotesB = (b.upvotes || 0) + (b.downvotes || 0);
      
      if (totalVotesB !== totalVotesA) {
        return totalVotesB - totalVotesA;
      }
      
      // If total votes are equal, sort by name
      return a.name.localeCompare(b.name);
    })
    .slice(0, displayCount);

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

  // Find the current category object
  const currentCategory = categories.find(cat => cat.id === selectedCategory) || categories[0];

  return (
    <div className="space-y-10">
      {/* Category Title */}
      <div className="mb-10">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl">{currentCategory.icon}</span>
          {currentCategory.name}
        </h3>
        <p className="text-muted-foreground mt-2">{currentCategory.description}</p>
      </div>
      
      {/* Category Navigation */}
      <ScrollArea className="w-full whitespace-nowrap mb-8">
        <div className="flex space-x-4 pb-4">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const categoryColor = category.color;
            
            return (
              <Button
                key={category.id}
                variant="outline"
                size="lg"
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "min-w-[140px] rounded-lg border-2 transition-all duration-300 shadow-md",
                  isSelected 
                    ? `${categoryColor} border-2 shadow-lg` 
                    : "border-border/50 hover:border-primary/30 bg-black/20"
                )}
              >
                <span className="mr-2 text-xl">{category.icon}</span>
                {category.name}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Product Rankings */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card-background/30 rounded-lg border border-white/5">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-6 text-muted-foreground">Loading products...</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card-background/30 rounded-lg border border-white/5">
            <p className="text-xl font-medium mb-2">No products found</p>
            <p className="text-muted-foreground max-w-md">
              Try selecting a different category or check back later for new additions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProducts.map((product, index) => (
              <ProductRankingCard 
                key={product.id} 
                product={product}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center mt-12">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 5)}
            className="premium-button bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary min-w-[200px]"
          >
            Show More Products
          </Button>
        </div>
      )}
    </div>
  )
}