"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { VoteType } from "@/types/product"

interface VoteButtonsProps {
  product: {
    id: string
    userVote: VoteType
    upvotes: number
    downvotes: number
  }
  onVote: (productId: string, voteType: VoteType) => Promise<void>
  className?: string
}

export function VoteButtons({ product, onVote, className }: VoteButtonsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleVote = async (voteType: VoteType) => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }

    try {
      await onVote(product.id, voteType)
      toast({
        title: "Vote recorded",
        children: `Your ${voteType === 'up' ? 'up' : 'down'}vote has been recorded.`
      })
    } catch (error) {
      toast({
        title: "Error",
        children: "Failed to record vote. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        className={cn(
          "gap-1 transition-colors",
          product.userVote === 'up' && "text-green-500 hover:text-green-600"
        )}
      >
        <ThumbsUp className={cn(
          "h-4 w-4",
          product.userVote === 'up' && "fill-green-500"
        )} />
        {product.upvotes}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        className={cn(
          "gap-1 transition-colors",
          product.userVote === 'down' && "text-red-500 hover:text-red-600"
        )}
      >
        <ThumbsDown className={cn(
          "h-4 w-4",
          product.userVote === 'down' && "fill-red-500"
        )} />
        {product.downvotes}
      </Button>
    </div>
  )
}