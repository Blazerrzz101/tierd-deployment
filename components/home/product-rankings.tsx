"use client"

import { useState } from "react"
import { categories, products } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useVote } from "@/hooks/use-vote"
import { VoteType } from "@/types/vote"

// Direct URL to a placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/1a1a1a/ff4b26?text=No+Image"

export function ProductRankings() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [displayCount, setDisplayCount] = useState(5)
  const { vote } = useVote()

  // Get products for the selected category
  const categoryProducts = products
    .filter(product => product.category === selectedCategory)
    .sort((a, b) => {
      // First sort by votes
      if (b.votes !== a.votes) return b.votes - a.votes
      // Then by rank if votes are equal
      return (a.rank || Infinity) - (b.rank || Infinity)
    })

  // Update ranks based on current sorting
  const rankedProducts = categoryProducts.map((product, index) => ({
    ...product,
    currentRank: index + 1
  }))

  const displayedProducts = rankedProducts.slice(0, displayCount)
  const hasMore = displayCount < rankedProducts.length

  const handleVote = async (productId: string, voteType: VoteType) => {
    await vote(productId, voteType)
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
              onClick={() => setSelectedCategory(category.id)}
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
        {displayedProducts.map((product, index) => (
          <div
            key={product.id}
            className="group relative flex items-center gap-6 rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
          >
            {/* Rank Number */}
            <div className={cn(
              "text-7xl font-bold tracking-tighter",
              index === 0 && "rank-gradient",
              index === 1 && "text-[#c0c0c0]",
              index === 2 && "text-[#cd7f32]",
            )}>
              #{product.currentRank}
            </div>

            {/* Product Image */}
            <div className="relative aspect-square w-32 overflow-hidden rounded-lg bg-muted">
              <Image
                src={product.imageUrl || PLACEHOLDER_IMAGE}
                alt={product.name || 'Product Image'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                {product.currentRank <= 3 && (
                  <span className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    product.currentRank === 1 && "bg-yellow-500/20 text-yellow-500",
                    product.currentRank === 2 && "bg-gray-400/20 text-gray-400",
                    product.currentRank === 3 && "bg-orange-700/20 text-orange-700",
                  )}>
                    #{product.currentRank} in {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-2 flex items-center gap-4">
                {product.price && (
                  <span className="text-sm font-medium">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {product.votes || 0} votes
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleVote(product.id, "down")}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    "hover:border-red-500 hover:text-red-500",
                    product.userVote === "down" && "border-red-500 text-red-500"
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleVote(product.id, "up")}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    "hover:border-green-500 hover:text-green-500",
                    product.userVote === "up" && "border-green-500 text-green-500"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/products/${product.url_slug}`}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="font-medium hover-glow"
                >
                  Learn More &gt;
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {/* Show More Button */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setDisplayCount(prev => prev + 5)}
          >
            Show More
          </Button>
        )}
      </div>
    </div>
  )
}