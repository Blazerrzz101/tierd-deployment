"use client"

import { Product } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Store } from "lucide-react"
import Image from "next/image"
import { StarRating } from "@/components/reviews/star-rating"
import { cn } from "@/lib/utils"
import { useVote } from "@/hooks/use-vote"

interface ProductTemplateProps {
  product: Product
}

export function ProductTemplate({ product }: ProductTemplateProps) {
  const { product: currentProduct, vote } = useVote(product)

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Badge variant="outline" className="mb-2">
          {currentProduct.category}
        </Badge>
        <h1 className="text-3xl font-bold">{currentProduct.name}</h1>
        <Badge className="mt-2 bg-primary">Rank #{currentProduct.rank}</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Image */}
        <Card className="overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={currentProduct.image_url || currentProduct.imageUrl}
              alt={currentProduct.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-4 p-4">
            <Button 
              variant="outline" 
              className={cn(
                "rounded-full hover:border-red-500 hover:text-red-500",
                currentProduct.userVote === "down" && "border-red-500 text-red-500"
              )}
              onClick={() => vote("down")}
            >
              <ThumbsDown className="h-5 w-5" />
            </Button>
            <span className="min-w-[4ch] text-center text-xl font-bold">
              {currentProduct.votes}
            </span>
            <Button 
              variant="outline" 
              className={cn(
                "rounded-full hover:border-green-500 hover:text-green-500",
                currentProduct.userVote === "up" && "border-green-500 text-green-500"
              )}
              onClick={() => vote("up")}
            >
              <ThumbsUp className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">${currentProduct.price.toFixed(2)}</h2>
              <Button className="warm-gradient text-white">
                <Store className="mr-2 h-5 w-5" />
                Buy Now
              </Button>
            </div>
            <p className="text-lg text-muted-foreground">{currentProduct.description}</p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Specifications</h3>
            <div className="grid gap-4">
              {Object.entries(currentProduct.details).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="font-medium capitalize">{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Overall Rating</h3>
            <div className="flex items-center gap-4">
              <StarRating rating={4.5} />
              <span className="text-muted-foreground">
                Based on {currentProduct.votes} votes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}