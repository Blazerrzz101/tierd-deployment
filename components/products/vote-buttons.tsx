"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { useVote } from "@/hooks/use-vote"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { cn } from "@/lib/utils"
import { Product, VoteType } from "@/types/product"
import { getClientId, generateClientId } from "@/utils/client-id"
import { toast } from "sonner"

interface VoteButtonsProps {
  product: Pick<Product, "id" | "name"> & {
    upvotes?: number;
    downvotes?: number;
    userVote?: {
      hasVoted: boolean;
      voteType: VoteType;
    } | number | null;
  }
  initialUpvotes?: number
  initialDownvotes?: number
  initialVoteType?: VoteType | number | null
  className?: string
}

export function VoteButtons({
  product,
  initialUpvotes = 5,
  initialDownvotes = 2,
  initialVoteType = null,
  className,
}: VoteButtonsProps) {
  const { user } = useEnhancedAuth()
  const { vote, getVoteStatus, isLoading: voteIsLoading } = useVote()
  
  // Safely access upvotes/downvotes with fallbacks
  const [upvotes, setUpvotes] = useState(
    product?.upvotes !== undefined ? product.upvotes : initialUpvotes
  )
  const [downvotes, setDownvotes] = useState(
    product?.downvotes !== undefined ? product.downvotes : initialDownvotes
  )
  
  // Extract vote type from either format
  const getInitialVoteType = () => {
    if (!product?.userVote && initialVoteType === null) return null;
    
    // Handle object format
    if (product?.userVote && typeof product.userVote === 'object' && 'voteType' in product.userVote) {
      return product.userVote.voteType;
    }
    
    // Handle number format
    if (product?.userVote && typeof product.userVote === 'number') {
      return product.userVote;
    }
    
    return initialVoteType;
  };
  
  const [voteType, setVoteType] = useState<number | null>(getInitialVoteType())
  const [isLoading, setIsLoading] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)

  // Calculate score
  const score = upvotes - downvotes

  // Initialize client ID
  useEffect(() => {
    // Ensure client ID is available
    function ensureClientId() {
      try {
        // Try to get existing client ID
        let id = getClientId();
        
        // If no client ID is found, generate a new one
        if (!id || id === 'server-side') {
          if (typeof window !== 'undefined') {
            id = generateClientId();
            localStorage.setItem('clientId', id);
            console.log('Generated new client ID:', id);
          } else {
            console.error('Cannot generate client ID on server side');
            return null;
          }
        }
        
        setClientId(id);
        return id;
      } catch (error) {
        console.error('Error ensuring client ID:', error);
        return null;
      }
    }
    
    ensureClientId();
  }, []);

  // Check for vote status on component mount
  useEffect(() => {
    async function checkVoteStatus() {
      if (product?.id) {
        try {
          const status = await getVoteStatus(product.id)
          
          if (status && status.success) {
            // Safely handle all properties with defaults
            setUpvotes(typeof status.upvotes === 'number' ? status.upvotes : initialUpvotes)
            setDownvotes(typeof status.downvotes === 'number' ? status.downvotes : initialDownvotes)
            setVoteType(status.voteType !== undefined ? status.voteType : null)
          }
        } catch (error) {
          console.error("Error checking vote status:", error)
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

  const handleUpvote = async () => {
    if (isLoading || voteIsLoading || !product?.id) return
    
    // Ensure client ID exists before voting
    if (!clientId) {
      const newClientId = typeof window !== 'undefined' ? getClientId() : null;
      
      if (!newClientId || newClientId === 'server-side') {
        toast.error("Unable to vote: Client ID unavailable", {
          description: "Please go to the debug page to fix this issue: /debug/client-id",
          action: {
            label: "Fix Now",
            onClick: () => window.location.href = "/debug/client-id"
          }
        });
        return;
      }
      
      setClientId(newClientId);
    }
    
    try {
      setIsLoading(true)
      const result = await vote(product, 1)
      
      if (result && !result.error) {
        setVoteType(1)
        setUpvotes(result.upvotes || upvotes)
        setDownvotes(result.downvotes || downvotes)
      }
    } catch (error) {
      console.error("Error upvoting:", error)
      toast.error("Error submitting your vote. Please try again later.");
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDownvote = async () => {
    if (isLoading || voteIsLoading || !product?.id) return
    
    // Ensure client ID exists before voting
    if (!clientId) {
      const newClientId = typeof window !== 'undefined' ? getClientId() : null;
      
      if (!newClientId || newClientId === 'server-side') {
        toast.error("Unable to vote: Client ID unavailable", {
          description: "Please go to the debug page to fix this issue: /debug/client-id",
          action: {
            label: "Fix Now",
            onClick: () => window.location.href = "/debug/client-id"
          }
        });
        return;
      }
      
      setClientId(newClientId);
    }
    
    try {
      setIsLoading(true)
      const result = await vote(product, -1)
      
      if (result && !result.error) {
        setVoteType(-1)
        setUpvotes(result.upvotes || upvotes)
        setDownvotes(result.downvotes || downvotes)
      }
    } catch (error) {
      console.error("Error downvoting:", error)
      toast.error("Error submitting your vote. Please try again later.");
    } finally {
      setIsLoading(false)
    }
  }

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
              disabled={isLoading}
            >
              <ArrowBigUp className="h-6 w-6" />
              <span className="sr-only">Upvote</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Upvote this product</p>
          </TooltipContent>
        </Tooltip>
        
        <span className="text-sm font-medium my-1">{score}</span>
        
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
              disabled={isLoading}
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