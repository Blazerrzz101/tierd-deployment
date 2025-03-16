"use client"

import Link from "next/link"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface RankingCardProps {
  rank: number
  product: Product
}

export function RankingCard({ rank, product }: RankingCardProps) {
  return (
    <div className="group relative flex items-center gap-6 rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
      {/* Rank Number */}
      <div className={cn(
        "text-6xl font-bold",
        rank === 1 && "text-[#ffd700]", // Gold
        rank === 2 && "text-[#c0c0c0]", // Silver
        rank === 3 && "text-[#cd7f32]", // Bronze
      )}>
        #{rank}
      </div>

      {/* Product Image */}
      <div className="relative h-32 w-32 overflow-hidden rounded-lg">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
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
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <ThumbsUp className="h-4 w-4" />
          </Button>
        </div>
        <Link href={`/products/${product.id}`}>
          <Button variant="secondary" size="sm">
            Learn More &gt;
          </Button>
        </Link>
      </div>
    </div>
  )
}