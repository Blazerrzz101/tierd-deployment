"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { useVote } from "@/hooks/use-vote"
import { Product } from "@/types/product"
import { cn } from "@/lib/utils"

interface VoteButtonsProps {
  product: Product
  className?: string
}

export function VoteButtons({ product, className }: VoteButtonsProps) {
  const { product: votedProduct, vote, isLoading } = useVote(product)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "hover:bg-primary/10",
          votedProduct.userVote === 'up' && "text-primary bg-primary/10"
        )}
        disabled={isLoading}
        onClick={() => vote(votedProduct.userVote === 'up' ? null : 'up')}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <span className="min-w-[2rem] text-center text-sm">
        {votedProduct.votes}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "hover:bg-destructive/10",
          votedProduct.userVote === 'down' && "text-destructive bg-destructive/10"
        )}
        disabled={isLoading}
        onClick={() => vote(votedProduct.userVote === 'down' ? null : 'down')}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  )
}