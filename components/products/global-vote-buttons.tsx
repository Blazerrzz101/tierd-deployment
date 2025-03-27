"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { cn } from "@/lib/utils"
import { Product } from "@/types/product"
import { useGlobalVotes } from "@/hooks/use-global-votes"

interface GlobalVoteButtonsProps {
  product: Pick<Product, "id" | "name">
  className?: string
}

export function GlobalVoteButtons({
  product,
  className,
}: GlobalVoteButtonsProps) {
  const { user } = useEnhancedAuth()
  const { useProductVoteStatus, useVoteMutation } = useGlobalVotes()
  const [isLoading, setIsLoading] = useState(false)
  
  // Get vote status from global cache
  const { 
    data: voteStatus,
    isLoading: isLoadingVoteStatus,
    error: voteStatusError
  } = useProductVoteStatus(product.id)
  
  // Use mutation for voting
  const voteMutation = useVoteMutation()
  
  // Extract vote info with sensible defaults
  const upvotes = voteStatus?.upvotes ?? 0
  const downvotes = voteStatus?.downvotes ?? 0
  const voteType = voteStatus?.voteType ?? null
  const score = voteStatus?.score ?? upvotes - downvotes
  
  // Handle voting
  const handleVote = async (newVoteType: 1 | -1) => {
    if (isLoading || voteMutation.isPending) return
    
    try {
      setIsLoading(true)
      
      // If already voted this type, send null to remove the vote
      const voteTypeToSend = voteType === newVoteType ? null : newVoteType
      
      await voteMutation.mutateAsync({
        productId: product.id,
        name: product.name,
        voteType: voteTypeToSend
      })
    } catch (error) {
      console.error(`Error handling vote:`, error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpvote = () => handleVote(1)
  const handleDownvote = () => handleVote(-1)
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex flex-col items-center", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full",
                voteType === 1 && "text-primary bg-primary/10"
              )}
              onClick={handleUpvote}
              disabled={isLoading || isLoadingVoteStatus || voteMutation.isPending}
            >
              <ArrowBigUp className="h-6 w-6" />
              <span className="sr-only">Upvote</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Upvote this product</p>
          </TooltipContent>
        </Tooltip>
        
        <span className="text-sm font-medium my-1">
          {isLoadingVoteStatus ? "..." : score}
        </span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full",
                voteType === -1 && "text-destructive bg-destructive/10"
              )}
              onClick={handleDownvote}
              disabled={isLoading || isLoadingVoteStatus || voteMutation.isPending}
            >
              <ArrowBigDown className="h-6 w-6" />
              <span className="sr-only">Downvote</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Downvote this product</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
} 