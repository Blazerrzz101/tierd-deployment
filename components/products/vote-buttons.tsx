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
  const [isLoading, setIsLoading] = useState(false)
  const { vote } = useVote()
  const { toast } = useToast()

  useEffect(() => {
    // Update state when initial values change
    setUpvotes(initialUpvotes)
    setDownvotes(initialDownvotes)
    setVoteType(initialVoteType)
  }, [initialUpvotes, initialDownvotes, initialVoteType])

  const handleVote = async (newVoteType: 1 | -1) => {
    setIsLoading(true);
    
    try {
      // Optimistic update
      const isCurrentVote = newVoteType === voteType;
      const updatedUpvotes = isCurrentVote && newVoteType === 1 
        ? upvotes - 1 
        : newVoteType === 1 && voteType !== 1
          ? upvotes + 1 
          : upvotes;
        
      const updatedDownvotes = isCurrentVote && newVoteType === -1 
        ? downvotes - 1 
        : newVoteType === -1 && voteType !== -1
          ? downvotes + 1 
          : downvotes;
      
      // Update local state immediately
      setUpvotes(updatedUpvotes);
      setDownvotes(updatedDownvotes);
      setVoteType(isCurrentVote ? null : newVoteType);
      
      // Call API
      const response = await vote(product, newVoteType);
      
      if (response?.success) {
        // Update with actual values from server
        if (typeof response.upvotes === 'number') {
          setUpvotes(response.upvotes);
        }
        
        if (typeof response.downvotes === 'number') {
          setDownvotes(response.downvotes);
        }
        
        setVoteType(response.voteType ?? (isCurrentVote ? null : newVoteType));
      } else {
        // Revert on error
        setUpvotes(initialUpvotes);
        setDownvotes(initialDownvotes);
        setVoteType(initialVoteType);
        
        toast({
          title: "Error",
          description: response?.error || "Failed to vote",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Vote error:", error);
      // Revert on error
      setUpvotes(initialUpvotes);
      setDownvotes(initialDownvotes);
      setVoteType(initialVoteType);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate score
  const score = upvotes - downvotes;

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
              disabled={isLoading}
              aria-label={voteType === 1 ? "Remove upvote" : "Upvote"}
            >
              <ArrowBigUp className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{voteType === 1 ? "Remove upvote" : "Upvote"}</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium">{score}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteType === -1 ? "text-red-500" : ""}`}
              onClick={() => handleVote(-1)}
              disabled={isLoading}
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