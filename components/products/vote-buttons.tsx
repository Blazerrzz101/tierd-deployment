"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowBigUp, ArrowBigDown, AlertCircle } from "lucide-react"
import { useVote } from "@/hooks/use-vote"
import { useEnhancedAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { InfinityIcon, ChevronRight } from "lucide-react"
import { Product } from "@/types/product"
import { getClientId } from "@/utils/client-id"

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
  const { vote, getVoteStatus, isLoading: voteIsLoading } = useVote()
  const { user, isLoading: authLoading } = useEnhancedAuth()
  
  // Add a state variable to track remaining votes
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null)
  
  // Add an effect to fetch remaining votes
  useEffect(() => {
    const fetchRemainingVotes = async () => {
      try {
        const response = await fetch(`/api/vote/remaining-votes?clientId=${getClientId()}`)
        if (response.ok) {
          const data = await response.json()
          setRemainingVotes(data.remainingVotes)
        }
      } catch (error) {
        console.error("Error fetching remaining votes:", error)
      }
    }
    
    if (!user) {
      fetchRemainingVotes()
    } else {
      // For authenticated users, set a high number
      setRemainingVotes(999)
    }
  }, [user])

  // Calculate score
  const score = upvotes - downvotes

  // Check for vote status on component mount
  useEffect(() => {
    async function checkVoteStatus() {
      if (product?.id) {
        try {
          setError(null)
          const status = await getVoteStatus(product.id)
          
          if (status && status.success) {
            // Safely handle all properties with defaults
            setUpvotes(typeof status.upvotes === 'number' ? status.upvotes : initialUpvotes)
            setDownvotes(typeof status.downvotes === 'number' ? status.downvotes : initialDownvotes)
            setVoteType(status.voteType !== undefined ? status.voteType : null)
          } else if (status && status.error) {
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

  // Add a state variable to track if vote is being processed
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (newVoteType: 1 | -1) => {
    // Don't allow voting if disabled or currently voting
    if (isLoading || isVoting || !product?.id) return
    
    // Start vote processing
    setIsVoting(true)
    
    // Check if user has remaining votes (for anonymous users)
    if (!user && (remainingVotes !== null && remainingVotes <= 0)) {
      toast.error("You've used all your votes. Sign in for unlimited voting!", {
        action: {
          label: "Sign In",
          onClick: () => {
            // Route to sign-in page
            window.location.href = "/auth/sign-in"
          }
        }
      })
      setIsVoting(false)
      return
    }
    
    try {
      // Determine if this is toggling a vote
      const isToggle = newVoteType === voteType
      
      // Optimistic UI updates
      const previousVoteType = voteType
      const previousUpvotes = upvotes
      const previousDownvotes = downvotes
      
      // Update local state (optimistically)
      if (isToggle) {
        // Toggling the vote (removing it)
        setVoteType(null)
        if (newVoteType === 1) {
          setUpvotes(prev => Math.max(0, prev - 1))
        } else {
          setDownvotes(prev => Math.max(0, prev - 1))
        }
      } else {
        // New vote or changing vote
        if (voteType === 1) {
          // Changing from upvote to downvote
          setUpvotes(prev => Math.max(0, prev - 1))
          setDownvotes(prev => prev + 1)
        } else if (voteType === -1) {
          // Changing from downvote to upvote
          setDownvotes(prev => Math.max(0, prev - 1))
          setUpvotes(prev => prev + 1)
        } else {
          // New vote
          if (newVoteType === 1) {
            setUpvotes(prev => prev + 1)
          } else {
            setDownvotes(prev => prev + 1)
          }
        }
        setVoteType(newVoteType)
      }
      
      // Call API to cast vote
      const response = await vote(product, newVoteType)
      
      if (!response || !response.success) {
        // Handle error response
        const errorMsg = response?.error || "Failed to cast vote"
        setError(errorMsg)
        console.error("Vote error:", errorMsg)
        
        toast.error(errorMsg)
        
        // Revert optimistic updates
        setUpvotes(previousUpvotes)
        setDownvotes(previousDownvotes)
        setVoteType(previousVoteType)
      } else {
        // Handle success
        // Update with actual server values
        if (typeof response.upvotes === 'number') {
          setUpvotes(response.upvotes)
        }
        
        if (typeof response.downvotes === 'number') {
          setDownvotes(response.downvotes)
        }
        
        // Set the vote type from the response
        if (response.voteType !== undefined) {
          setVoteType(response.voteType)
        }
        
        // Show feedback based on the vote action
        if (isToggle) {
          toast.success("Vote removed")
        } else if (previousVoteType !== null) {
          toast.success("Vote changed")
        } else {
          toast.success(newVoteType === 1 ? "Upvoted!" : "Downvoted!")
        }
        
        // Update remaining votes
        if (response.remainingVotes !== undefined) {
          setRemainingVotes(response.remainingVotes)
        }
        
        // If authenticated, show different message
        if (user) {
          // No remaining votes limit for authenticated users
        } else {
          // Show remaining votes for anonymous users
          const votesLeft = response.remainingVotes || 0
          if (votesLeft <= 2) {
            toast.info(`You have ${votesLeft} ${votesLeft === 1 ? 'vote' : 'votes'} left. Sign in for unlimited voting!`, {
              action: {
                label: "Sign In",
                onClick: () => {
                  window.location.href = "/auth/sign-in"
                }
              }
            })
          }
        }
      }
    } catch (error) {
      console.error("Error casting vote:", error)
      toast.error("Failed to cast vote. Please try again.")
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
              className={`h-8 w-8 ${voteType === 1 ? "text-green-500" : ""} transition-colors duration-200`}
              onClick={() => handleVote(1)}
              disabled={isLoading || isVoting}
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
              disabled={isLoading || isVoting}
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
        
        {/* Add visual indication for authenticated users */}
        {user && (
          <span className="text-xs text-muted-foreground ml-1 flex items-center">
            <Badge variant="outline" className="px-1 py-0 h-4 text-[10px]">
              <InfinityIcon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Unlimited</span>
            </Badge>
          </span>
        )}
        
        {/* Show sign in prompt for anonymous users with low votes */}
        {!user && !isLoading && !authLoading && remainingVotes !== null && (remainingVotes <= 3) && (
          <span className="text-xs text-muted-foreground ml-1 flex items-center">
            <Badge variant="outline" className="px-1 py-0 h-5 text-[10px]">
              <span>{remainingVotes}</span>
              <span className="hidden sm:inline mx-1">votes left</span>
              <ChevronRight className="h-3 w-3" />
            </Badge>
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}