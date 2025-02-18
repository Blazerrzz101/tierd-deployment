"use client"

import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VoteType } from "@/types/vote"
import { Product } from "@/types/product"

interface VoteButtonsProps {
  product: Product
  onVote: (productId: string, voteType: VoteType) => Promise<void>
  className?: string
}

export function VoteButtons({ 
  product,
  onVote,
  className 
}: VoteButtonsProps) {
  if (!product?.id) {
    return null;
  }

  const handleVote = async (type: VoteType) => {
    await onVote(product.id, type)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-1 transition-colors",
          product?.userVote === 1 && "bg-green-500/20 hover:bg-green-500/30 text-green-500"
        )}
        onClick={() => handleVote('upvote')}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="min-w-[1rem] text-center">
          {product?.upvotes || 0}
        </span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-1 transition-colors",
          product?.userVote === -1 && "bg-red-500/20 hover:bg-red-500/30 text-red-500"
        )}
        onClick={() => handleVote('downvote')}
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="min-w-[1rem] text-center">
          {product?.downvotes || 0}
        </span>
      </Button>
    </div>
  )
}