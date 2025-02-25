"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVote } from "@/hooks/use-vote"
import { useToast } from "@/components/ui/use-toast"
import { VoteType } from "@/types/product"

interface VoteProduct {
  id: string;
  name: string;
}

interface VoteResult {
  success: boolean;
  error?: string;
  upvotes: number;
  downvotes: number;
  voteType: VoteType;
}

interface VoteButtonsProps {
  productId?: string;
  product?: {
    id: string;
    name?: string;
    upvotes?: number;
    downvotes?: number;
    score?: number;
    userVote?: {
      hasVoted?: boolean;
      voteType?: VoteType;
    };
  };
  className?: string;
  size?: "default" | "sm";
  variant?: "default" | "outline" | "ghost";
  isAuthenticated?: boolean;
}

export function VoteButtons({
  productId,
  product,
  className,
  size = "default",
  variant = "outline",
  isAuthenticated = false,
}: VoteButtonsProps) {
  const { vote } = useVote()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)
  const [voteType, setVoteType] = useState<VoteType>(null)

  // Initialize state from product prop
  useEffect(() => {
    if (product) {
      setUpvotes(product.upvotes || 0)
      setDownvotes(product.downvotes || 0)
      setVoteType(product.userVote?.voteType || null)
    }
  }, [product])

  // Resolve the product ID and name
  const resolvedProductId = productId || product?.id
  const productName = product?.name
  if (!resolvedProductId || !productName) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button size={size} variant={variant} disabled>0</Button>
        <Button size={size} variant={variant} disabled>0</Button>
      </div>
    )
  }

  const handleVote = async (newVoteType: 1 | -1) => {
    setIsLoading(true)
    
    try {
      // Store current state for rollback
      const prevUpvotes = upvotes
      const prevDownvotes = downvotes
      const prevVoteType = voteType
      
      // Optimistically update UI
      if (voteType === newVoteType) {
        // Remove vote
        setVoteType(null)
        if (newVoteType === 1) setUpvotes(prev => Math.max(0, prev - 1))
        else setDownvotes(prev => Math.max(0, prev - 1))
      } else {
        // Add or change vote
        setVoteType(newVoteType)
        if (newVoteType === 1) {
          setUpvotes(prev => prev + 1)
          if (voteType === -1) setDownvotes(prev => Math.max(0, prev - 1))
        } else {
          setDownvotes(prev => prev + 1)
          if (voteType === 1) setUpvotes(prev => Math.max(0, prev - 1))
        }
      }

      // Call vote API
      const voteProduct: VoteProduct = {
        id: resolvedProductId,
        name: productName
      }
      const result = await vote(voteProduct, newVoteType) as VoteResult

      if (!result?.success) {
        // Rollback on error
        setUpvotes(prevUpvotes)
        setDownvotes(prevDownvotes)
        setVoteType(prevVoteType)
        throw new Error(result?.error || 'Vote failed')
      }

      // Update state with actual values from server
      if (typeof result.upvotes === 'number') setUpvotes(result.upvotes)
      if (typeof result.downvotes === 'number') setDownvotes(result.downvotes)
      if (result.voteType !== undefined) setVoteType(result.voteType)

      // Show success message
      toast({
        title: result.voteType === null ? "Vote Removed" : (newVoteType === 1 ? "Upvoted" : "Downvoted"),
        description: `Successfully ${result.voteType === null ? "removed vote from" : (newVoteType === 1 ? "upvoted" : "downvoted")} ${productName}`
      })
    } catch (error) {
      console.error('Vote error:', error)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant={variant}
            className={cn(
              "font-mono",
              voteType === 1 && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            disabled={isLoading}
            onClick={() => handleVote(1)}
          >
            <ArrowBigUp className={cn(
              "mr-0.5 h-5 w-5",
              voteType === 1 ? "fill-current" : "fill-none"
            )} />
            {upvotes}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {voteType === 1 ? "Remove upvote" : "Upvote"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant={variant}
            className={cn(
              "font-mono",
              voteType === -1 && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            disabled={isLoading}
            onClick={() => handleVote(-1)}
          >
            <ArrowBigDown className={cn(
              "mr-0.5 h-5 w-5",
              voteType === -1 ? "fill-current" : "fill-none"
            )} />
            {downvotes}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {voteType === -1 ? "Remove downvote" : "Downvote"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}