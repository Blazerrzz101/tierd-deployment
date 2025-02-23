"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVote, VoteProduct } from "@/hooks/use-vote"
import { VoteType } from "@/types/product"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface VoteButtonsProps {
  product: VoteProduct;
  className?: string;
}

interface LocalVotes {
  upvotes: number;
  downvotes: number;
  userVote: VoteType | null;
}

export function VoteButtons({ product, className }: VoteButtonsProps) {
  const { vote, isLoading, isAuthenticated } = useVote()
  const [localVotes, setLocalVotes] = useState<LocalVotes>({
    upvotes: product.upvotes || 0,
    downvotes: product.downvotes || 0,
    userVote: product.userVote || null
  })

  // Update local state when product props change
  useEffect(() => {
    setLocalVotes({
      upvotes: product.upvotes || 0,
      downvotes: product.downvotes || 0,
      userVote: product.userVote || null
    })
  }, [product.upvotes, product.downvotes, product.userVote])

  const handleVote = async (voteType: VoteType) => {
    if (isLoading) return

    const previousState = { ...localVotes }
    const isRemovingVote = localVotes.userVote === voteType
    const newVoteType = isRemovingVote ? null : voteType

    // Optimistically update UI
    setLocalVotes(prev => ({
      upvotes: prev.upvotes + (
        voteType === 1 ? (isRemovingVote ? -1 : 1) : 
        prev.userVote === 1 ? -1 : 0
      ),
      downvotes: prev.downvotes + (
        voteType === -1 ? (isRemovingVote ? -1 : 1) :
        prev.userVote === -1 ? -1 : 0
      ),
      userVote: newVoteType
    }))

    try {
      const result = await vote(product, voteType)
      if (result === undefined) {
        setLocalVotes(previousState)
      }
    } catch (error) {
      setLocalVotes(previousState)
    }
  }

  const renderVoteButton = (voteType: VoteType, Icon: typeof ArrowBigUp | typeof ArrowBigDown) => {
    const isUpvote = voteType === 1
    const tooltipText = isAuthenticated
      ? `Click to ${localVotes.userVote === voteType ? 'remove' : ''} ${isUpvote ? 'upvote' : 'downvote'}`
      : 'Sign in to keep your votes'

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-colors",
              localVotes.userVote === voteType
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "hover:bg-primary/10",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleVote(voteType)}
            disabled={isLoading}
          >
            <Icon className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2 items-center", className)}>
      {renderVoteButton(1, ArrowBigUp)}
      <span className="text-center text-sm font-medium min-w-[2rem]">
        {localVotes.upvotes - localVotes.downvotes}
      </span>
      {renderVoteButton(-1, ArrowBigDown)}
    </div>
  )
}