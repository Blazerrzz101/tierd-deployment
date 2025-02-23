"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVote } from "@/hooks/use-vote"
import { Product, VoteType } from "@/types/product"

interface VoteButtonsProps {
  product: Product;
  className?: string;
}

export function VoteButtons({ product, className }: VoteButtonsProps) {
  const { vote, loading: isVoting, isAuthenticated } = useVote();
  const [loadingState, setLoadingState] = useState<{[K in VoteType]?: boolean}>({});
  const [localVotes, setLocalVotes] = useState({
    upvotes: product.upvotes || 0,
    downvotes: product.downvotes || 0,
    userVote: product.userVote
  });

  const handleVote = async (voteType: VoteType) => {
    if (!isAuthenticated) {
      // Let useVote handle the redirect
      await vote(product, voteType);
      return;
    }

    setLoadingState(prev => ({ ...prev, [voteType]: true }));
    try {
      const success = await vote(product, voteType);
      
      // Only update local state if vote was successful
      if (success) {
        setLocalVotes(prev => {
          const isRemovingVote = prev.userVote === voteType;
          const newUserVote = isRemovingVote ? null : voteType;
          
          return {
            upvotes: prev.upvotes + (
              voteType === 1 
                ? (isRemovingVote ? -1 : 1) 
                : (prev.userVote === 1 ? -1 : 0)
            ),
            downvotes: prev.downvotes + (
              voteType === -1 
                ? (isRemovingVote ? -1 : 1) 
                : (prev.userVote === -1 ? -1 : 0)
            ),
            userVote: newUserVote
          };
        });
      }
    } finally {
      setLoadingState(prev => ({ ...prev, [voteType]: false }));
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={loadingState[1] || loadingState[-1] || isVoting}
        className={cn(
          "gap-1 transition-colors",
          localVotes.userVote === 1 && "text-green-500 hover:text-green-600"
        )}
      >
        {loadingState[1] ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className={cn(
            "h-4 w-4",
            localVotes.userVote === 1 && "fill-green-500"
          )} />
        )}
        <span>{localVotes.upvotes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={loadingState[1] || loadingState[-1] || isVoting}
        className={cn(
          "gap-1 transition-colors",
          localVotes.userVote === -1 && "text-red-500 hover:text-red-600"
        )}
      >
        {loadingState[-1] ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className={cn(
            "h-4 w-4",
            localVotes.userVote === -1 && "fill-red-500"
          )} />
        )}
        <span>{localVotes.downvotes}</span>
      </Button>
    </div>
  )
}