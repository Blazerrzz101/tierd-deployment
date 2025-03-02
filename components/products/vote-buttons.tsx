"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowBigUp, ArrowBigDown, AlertCircle } from "lucide-react"
import { useVote } from "@/hooks/use-vote"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/types/product"
import { useEnhancedAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"

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
  const [error, setError] = useState<string | null>(null)
  const { vote, getVoteStatus, isLoading: voteIsLoading, remainingVotes } = useVote()
  const { toast } = useToast()
  const { user, isAuthenticated } = useEnhancedAuth()

  // Calculate score
  const score = upvotes - downvotes

  // Check for vote status on component mount
  useEffect(() => {
    async function checkVoteStatus() {
      if (product?.id) {
        try {
          setError(null)
          const status = await getVoteStatus(product.id)
          
          if (status.success) {
            // Safely handle all properties with defaults
            setUpvotes(typeof status.upvotes === 'number' ? status.upvotes : initialUpvotes)
            setDownvotes(typeof status.downvotes === 'number' ? status.downvotes : initialDownvotes)
            setVoteType(status.voteType !== undefined ? status.voteType : null)
          } else if (status.error) {
            console.error("Error checking vote status:", status.error)
            setError(status.error)
          }
        } catch (error) {
          console.error("Error checking vote status:", error)
          setError(error instanceof Error ? error.message : "Unknown error checking vote status")
        }
      }
    }
    
    checkVoteStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])

  useEffect(() => {
    // Update state when initial values change
    setUpvotes(initialUpvotes)
    setDownvotes(initialDownvotes)
    // Safely handle initialVoteType
    setVoteType(initialVoteType !== undefined ? initialVoteType : null)
  }, [initialUpvotes, initialDownvotes, initialVoteType])

  const handleVote = async (newVoteType: 1 | -1) => {
    if (!product?.id) {
      toast({
        title: "Error",
        description: "Cannot vote on invalid product",
        variant: "destructive",
      });
      return;
    }
    
    // Check if anonymous user has votes remaining
    if (user?.isAnonymous && remainingVotes !== null && remainingVotes <= 0) {
      toast({
        title: "Vote limit reached",
        description: "Please sign in to continue voting",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine what kind of vote action this is (add, remove, or change vote)
      const isCurrentVote = newVoteType === voteType;
      const isChangeVote = voteType !== null && voteType !== newVoteType;
      
      // Calculate optimistic updates
      const updatedUpvotes = (() => {
        if (isCurrentVote && newVoteType === 1) {
          // Removing an upvote
          return Math.max(0, upvotes - 1);
        } else if (isChangeVote && newVoteType === 1) {
          // Changing from downvote to upvote
          return upvotes + 1;
        } else if (isChangeVote && newVoteType === -1) {
          // Changing from upvote to downvote
          return Math.max(0, upvotes - 1);
        } else if (newVoteType === 1) {
          // Adding an upvote
          return upvotes + 1;
        }
        return upvotes;
      })();
      
      const updatedDownvotes = (() => {
        if (isCurrentVote && newVoteType === -1) {
          // Removing a downvote
          return Math.max(0, downvotes - 1);
        } else if (isChangeVote && newVoteType === -1) {
          // Changing from upvote to downvote
          return downvotes + 1;
        } else if (isChangeVote && newVoteType === 1) {
          // Changing from downvote to upvote
          return Math.max(0, downvotes - 1);
        } else if (newVoteType === -1) {
          // Adding a downvote
          return downvotes + 1;
        }
        return downvotes;
      })();
      
      // Update local state immediately (optimistic update)
      setUpvotes(updatedUpvotes);
      setDownvotes(updatedDownvotes);
      setVoteType(isCurrentVote ? null : newVoteType);
      
      // Call API
      const response = await vote(product, newVoteType);
      
      if (response && response.success) {
        // Update with actual values from server
        if (typeof response.upvotes === 'number') {
          setUpvotes(response.upvotes);
        }
        
        if (typeof response.downvotes === 'number') {
          setDownvotes(response.downvotes);
        }
        
        // Safely handle the voteType property - this fixes the TypeError
        setVoteType(response.voteType !== undefined ? response.voteType : null);
      } else {
        // Revert on error
        setUpvotes(initialUpvotes);
        setDownvotes(initialDownvotes);
        setVoteType(initialVoteType);
        
        const errorMsg = response?.error || "Failed to vote";
        setError(errorMsg);
        console.error("Vote error:", errorMsg);
        
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Vote error:", error);
      // Revert on error
      setUpvotes(initialUpvotes);
      setDownvotes(initialDownvotes);
      setVoteType(initialVoteType);
      
      const errorMsg = error instanceof Error ? error.message : "Failed to vote";
      setError(errorMsg);
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteType === 1 ? "text-green-500" : ""} transition-colors duration-200`}
              onClick={() => handleVote(1)}
              disabled={isLoading || voteIsLoading}
              aria-label={voteType === 1 ? "Remove upvote" : "Upvote"}
            >
              <ArrowBigUp className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{voteType === 1 ? "Remove upvote" : "Upvote"}</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Show score with dynamic styling */}
        <span className={`text-sm font-medium ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {score}
        </span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteType === -1 ? "text-red-500" : ""} transition-colors duration-200`}
              onClick={() => handleVote(-1)}
              disabled={isLoading || voteIsLoading}
              aria-label={voteType === -1 ? "Remove downvote" : "Downvote"}
            >
              <ArrowBigDown className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{voteType === -1 ? "Remove downvote" : "Downvote"}</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Display error if present */}
        {error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-red-500 mt-1 cursor-help">
                <AlertCircle className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{error}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Show vote limit for anonymous users */}
        {user?.isAnonymous && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {remainingVotes !== null ? `${remainingVotes} votes left` : 'Limited votes'}
            </Badge>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}