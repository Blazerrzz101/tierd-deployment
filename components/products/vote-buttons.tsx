"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { useVote } from "@/hooks/use-vote"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/types/product"

interface VoteButtonsProps {
  product: Pick<Product, "id" | "name">
  initialUpvotes?: number
  initialDownvotes?: number
  initialVoteType?: number | null
}

export function VoteButtons({
  product,
  initialUpvotes = 5,
  initialDownvotes = 2,
  initialVoteType = null,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [voteType, setVoteType] = useState<number | null>(initialVoteType)
  const [isVoting, setIsVoting] = useState(false)
  const { vote } = useVote()
  const { toast } = useToast()

  useEffect(() => {
    // Update state when initial values change
    setUpvotes(initialUpvotes)
    setDownvotes(initialDownvotes)
    setVoteType(initialVoteType)
  }, [initialUpvotes, initialDownvotes, initialVoteType])

  const handleVote = async (newVoteType: 1 | -1) => {
    if (!product?.id || isVoting) return

    setIsVoting(true)
    
    // Store original values for potential rollback
    const oldVoteType = voteType
    const oldUpvotes = upvotes
    const oldDownvotes = downvotes

    try {
      // Calculate optimistic update
      let updatedUpvotes = upvotes
      let updatedDownvotes = downvotes

      // If voting the same way, we're removing the vote
      if (oldVoteType === newVoteType) {
        if (newVoteType === 1) updatedUpvotes--
        if (newVoteType === -1) updatedDownvotes--
        setVoteType(null)
      } else {
        // Remove old vote if it exists
        if (oldVoteType === 1) updatedUpvotes--
        if (oldVoteType === -1) updatedDownvotes--
        
        // Add new vote
        if (newVoteType === 1) updatedUpvotes++
        if (newVoteType === -1) updatedDownvotes++
        setVoteType(newVoteType)
      }

      // Apply optimistic update for vote counts
      setUpvotes(updatedUpvotes)
      setDownvotes(updatedDownvotes)

      // Send vote to server
      const response = await vote(product, newVoteType)

      if (!response?.success) {
        throw new Error(response?.error || "Failed to vote")
      }

      // Update with server values if they exist
      if (response.result) {
        setUpvotes(response.result.upvotes)
        setDownvotes(response.result.downvotes)
        setVoteType(response.result.voteType)

        // Show success message
        toast({
          title: response.result.voteType === null ? "Vote Removed" : "Vote Recorded",
          description: `Successfully ${response.result.voteType === null ? "removed vote from" : (response.result.voteType === 1 ? "upvoted" : "downvoted")} ${product.name}`,
        })
      }
    } catch (error) {
      // Revert to original values on failure
      setUpvotes(oldUpvotes)
      setDownvotes(oldDownvotes)
      setVoteType(oldVoteType)
      
      console.error("Vote error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteType === 1 ? "text-green-500" : ""}`}
              onClick={() => handleVote(1)}
              disabled={isVoting}
              aria-label={voteType === 1 ? "Remove upvote" : "Upvote"}
            >
              <ArrowBigUp className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{voteType === 1 ? "Remove upvote" : "Upvote"}</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium">{upvotes - downvotes}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteType === -1 ? "text-red-500" : ""}`}
              onClick={() => handleVote(-1)}
              disabled={isVoting}
              aria-label={voteType === -1 ? "Remove downvote" : "Downvote"}
            >
              <ArrowBigDown className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{voteType === -1 ? "Remove downvote" : "Downvote"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}