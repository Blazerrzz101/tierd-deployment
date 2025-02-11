"use client"

import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVote } from "@/hooks/use-vote"
import { cn } from "@/lib/utils"
import { VoteType } from "@/types/vote"

interface VoteButtonsProps {
  productId: string
  upvotes: number
  downvotes: number
  userVote?: VoteType | null
  className?: string
}

export function VoteButtons({ 
  productId, 
  upvotes = 0, 
  downvotes = 0, 
  userVote = null,
  className 
}: VoteButtonsProps) {
  const { vote, isLoading } = useVote()

  const handleVote = (type: VoteType) => {
    if (!isLoading) {
      vote(productId, type)
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-1",
          userVote === 'up' && "bg-green-100 hover:bg-green-200"
        )}
        onClick={() => handleVote('up')}
        disabled={isLoading}
      >
        <ThumbsUp className={cn(
          "h-4 w-4",
          userVote === 'up' && "text-green-600"
        )} />
        <span>{upvotes}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-1",
          userVote === 'down' && "bg-red-100 hover:bg-red-200"
        )}
        onClick={() => handleVote('down')}
        disabled={isLoading}
      >
        <ThumbsDown className={cn(
          "h-4 w-4",
          userVote === 'down' && "text-red-600"
        )} />
        <span>{downvotes}</span>
      </Button>
    </div>
  )
}