"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import Image from "next/image"
import { products } from "@/lib/data"
import { categories } from "@/lib/data"

interface GameRankingsProps {
  gameId: string
}

export function GameRankings({ gameId }: GameRankingsProps) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [displayCount, setDisplayCount] = useState(5)

  // Get products for the selected category
  const categoryProducts = products
    .filter(product => product.category === selectedCategory)
    .sort((a, b) => b.votes - a.votes)

  const displayedProducts = categoryProducts.slice(0, displayCount)
  const hasMore = displayCount < categoryProducts.length

  return (
    <div className="space-y-6">
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
                "min-w-[120px] rounded-full",
                selectedCategory === category.id && 
                "bg-primary text-primary-foreground hover:bg-primary/90"
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
            className="flex items-center gap-6 rounded-lg border bg-card p-6"
          >
            {/* Rank Number */}
            <div className={cn(
              "text-6xl font-bold",
              index === 0 && "text-[#ffd700]", // Gold
              index === 1 && "text-[#c0c0c0]", // Silver
              index === 2 && "text-[#cd7f32]", // Bronze
            )}>
              #{index + 1}
            </div>

            {/* Product Image */}
            <div className="relative h-32 w-32 overflow-hidden rounded-lg">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-1 flex-col gap-2">
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:text-red-500"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <span className="min-w-[3ch] text-center font-medium">
                  {product.votes}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:text-green-500"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="secondary" size="sm">
                Learn More &gt;
              </Button>
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