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

export function ProductRankings() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [displayCount, setDisplayCount] = useState(5)

  // Get products for the selected category
  const categoryProducts = products
    .filter(product => product.category === selectedCategory)
    .sort((a, b) => b.votes - a.votes)

  const displayedProducts = categoryProducts.slice(0, displayCount)
  const hasMore = displayCount < categoryProducts.length

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
        {displayedProducts.map((product, index) => {
          const { product: currentProduct, vote } = useVote(product)
          
          return (
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
                #{index + 1}
              </div>

              {/* Product Image */}
              <div className="relative aspect-square w-32 overflow-hidden rounded-lg">
                <Image
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="text-xl font-semibold">{currentProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{currentProduct.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-sm font-medium">
                    ${currentProduct.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentProduct.votes} votes
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => vote("down")}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      "hover:border-red-500 hover:text-red-500",
                      currentProduct.userVote === "down" && "border-red-500 text-red-500"
                    )}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => vote("up")}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      "hover:border-green-500 hover:text-green-500",
                      currentProduct.userVote === "up" && "border-green-500 text-green-500"
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                </div>
                <Link href={`/products/${currentProduct.id}`}>
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
          )
        })}

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