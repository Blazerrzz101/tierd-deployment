"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VoteType } from "@/types/vote"
import { Product } from "@/types/product"
import { useVoteLimiter } from "@/hooks/use-vote-limiter"
import { useAuthStore } from "@/lib/auth/auth-store"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

interface VoteButtonsProps {
  product: Product
  onVote: (productId: string, voteType: VoteType) => Promise<void>
  className?: string
  showTooltips?: boolean
}

export function VoteButtons({ 
  product,
  onVote,
  className,
  showTooltips = true
}: VoteButtonsProps) {
  const { canVote, remainingCooldown, resetTime } = useVoteLimiter()
  const [votingType, setVotingType] = useState<VoteType | null>(null)
  const { isAuthenticated } = useAuthStore()

  if (!product?.id) {
    return null
  }

  const handleVote = async (type: VoteType) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to vote")
      return
    }

    if (!canVote || votingType !== null) return
    
    setVotingType(type)
    try {
      await onVote(product.id, type)
    } finally {
      setVotingType(null)
    }
  }

  const formatCooldown = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  const VoteButton = ({ type, icon: Icon, count }: { 
    type: VoteType
    icon: any
    count: number 
  }) => {
    const isUpvote = type === "upvote"
    const activeClass = isUpvote ? "text-green-600" : "text-red-600"
    const isVoting = votingType === type

    const button = (
      <motion.div
        whileHover={{ scale: canVote ? 1.05 : 1 }}
        whileTap={{ scale: canVote ? 0.95 : 1 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-1 transition-colors relative",
            product?.userVote === (isUpvote ? 1 : -1) && activeClass,
            (!canVote || !isAuthenticated) && "opacity-50 cursor-not-allowed",
            isVoting && "cursor-wait"
          )}
          onClick={() => handleVote(type)}
          disabled={!canVote || !isAuthenticated || votingType !== null}
        >
          {isVoting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="min-w-[1rem] text-center"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </Button>
      </motion.div>
    )

    if (!showTooltips) return button

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            {!isAuthenticated ? (
              <p className="text-sm">Please sign in to vote</p>
            ) : !canVote ? (
              <div className="text-sm">
                <p>Vote cooldown: {formatCooldown(remainingCooldown)}</p>
                {resetTime && (
                  <p className="text-muted-foreground">
                    Resets at {new Date(resetTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm">
                Click to {type} this product
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VoteButton 
        type="upvote" 
        icon={ThumbsUp} 
        count={product?.upvotes || 0} 
      />
      <VoteButton 
        type="downvote" 
        icon={ThumbsDown} 
        count={product?.downvotes || 0} 
      />
    </div>
  )
}