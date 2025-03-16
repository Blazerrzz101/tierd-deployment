"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRate?: (rating: number) => void
  interactive?: boolean
}

export function StarRating({ rating, onRate, interactive = false }: StarRatingProps) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "fill-primary text-primary" : "fill-none text-muted-foreground",
            interactive && "cursor-pointer transition-colors hover:text-primary"
          )}
          onClick={() => interactive && onRate?.(star)}
        />
      ))}
    </div>
  )
}